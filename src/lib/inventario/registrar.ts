import "server-only";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type RegistrarMovimientoInput = {
  materialId: string;
  tipo: "ENTRADA" | "SALIDA";
  /** En unidades de compra (ej: bolsas), no en la unidad de medida del material. */
  cantidad: number;
  costo: number | null;
  notas: string | null;
  esCompra: boolean;
  /** "" si no es compra. */
  proveedorId: string;
  esCredito: boolean;
  /**
   * IDs a usar para el/los registro(s) que se crean -- igual que en
   * produccion/registrar.ts y extras/registrar.ts: si se pasan (movimiento
   * que se generó en el navegador sin conexión), esta función se vuelve
   * idempotente por idMovimiento (ver más abajo), así reintentar la
   * sincronización nunca duplica ni el movimiento, ni la compra, ni el
   * gasto automático, NI ajusta el stock dos veces. Sin conexión de por
   * medio, no se pasan y Prisma genera cuid() nuevos como siempre.
   */
  idMovimiento?: string;
  idCompra?: string;
  idGasto?: string;
  /** Momento real del registro sin conexión (ver mismo campo en produccion/extras). */
  fecha?: Date;
  sincronizadoOffline?: boolean;
};

export type RegistrarMovimientoResultado =
  | { error: string; movimientoId?: undefined }
  | { error?: undefined; movimientoId: string; compraId: string | null };

type ResultadoTransaccion =
  | { ok: false; error: string }
  | {
      ok: true;
      movimientoId: string;
      compraId: string | null;
      /** true solo si esta llamada creó el movimiento de verdad (no un reintento no-op). */
      nuevo: boolean;
      materialNombre: string;
      montoTotal: number;
    };

/**
 * Lógica compartida de "registrar un movimiento de inventario" (entrada o
 * salida, opcionalmente una compra a un proveedor, opcionalmente a
 * crédito) -- la usa tanto la Server Action (inventario/actions.ts, ya no
 * la llama el formulario pero se deja funcionando) como la ruta de API
 * src/app/api/offline/inventario/route.ts. Ver propuesta-modo-offline.md.
 *
 * Fuera de alcance a propósito (quedan solo con Server Action, requieren
 * conexión): crear/editar un MaterialInventario, marcar una compra a
 * crédito como pagada, borrar un movimiento, y el CRUD de proveedores --
 * todas esas son ediciones de un registro que ya existe o tareas
 * administrativas poco frecuentes, no la bitácora de uso diario.
 *
 * IMPORTANTE sobre idempotencia: a diferencia de un RegistroProduccion o
 * un PagoExtraEmpleado (que no tienen ningún efecto sobre otro registro),
 * crear un movimiento SÍ tiene un efecto secundario -- ajusta
 * MaterialInventario.cantidadActual, y si es una compra pagada de una vez
 * también crea un Gasto. Un simple upsert-por-id en el movimiento no
 * alcanza para que reintentar la sincronización sea seguro: el upsert no
 * vuelve a crear la fila, pero un `increment` de stock si no se protege sí
 * se volvería a aplicar. Por eso, cuando viene idMovimiento, la función
 * primero revisa si ese movimiento YA existe -- si existe, no se toca el
 * stock ni se crea nada de nuevo, se devuelve tal cual quedó la primera
 * vez (no-op idempotente); solo si no existía se hace el trabajo real.
 */
export async function registrarMovimientoCompartido(
  input: RegistrarMovimientoInput
): Promise<RegistrarMovimientoResultado> {
  const {
    materialId,
    tipo,
    cantidad,
    costo,
    notas,
    esCompra,
    proveedorId,
    esCredito,
    idMovimiento,
    idCompra,
    idGasto,
    fecha,
    sincronizadoOffline,
  } = input;

  if (!materialId) return { error: "Selecciona un material." };
  if (tipo !== "ENTRADA" && tipo !== "SALIDA") {
    return { error: "Selecciona si es una entrada o una salida." };
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { error: "La cantidad debe ser un número mayor a 0." };
  }
  if (costo !== null && (!Number.isFinite(costo) || costo < 0)) {
    return { error: "El costo no es válido." };
  }
  if (esCompra) {
    if (tipo !== "ENTRADA") {
      return { error: "Una compra solo aplica a una entrada de inventario." };
    }
    if (!proveedorId) return { error: "Selecciona el proveedor de la compra." };
    if (costo === null || costo <= 0) {
      return { error: "Escribe el costo por unidad para calcular el total de la compra." };
    }
  }

  const resultado: ResultadoTransaccion = await prisma.$transaction(async (tx) => {
    // Reintento de un movimiento que ya se sincronizó antes (la respuesta
    // se perdió justo al reconectar, por ejemplo) -- no-op idempotente,
    // ver comentario grande arriba. Se detecta ANTES de tocar nada más.
    if (idMovimiento) {
      const existente = await tx.movimientoInventario.findUnique({
        where: { id: idMovimiento },
        include: { material: true },
      });
      if (existente) {
        return {
          ok: true,
          movimientoId: existente.id,
          compraId: existente.compraId,
          nuevo: false,
          materialNombre: existente.material.nombre,
          montoTotal: 0,
        };
      }
    }

    const material = await tx.materialInventario.findUnique({ where: { id: materialId } });
    if (!material) return { ok: false, error: "Ese material ya no existe." };

    const cantidadPorUnidad = Number(material.cantidadPorUnidad);
    const cantidadEnUnidadBase = cantidad * cantidadPorUnidad;

    // Esta comprobación SIEMPRE se hace contra el stock real en el
    // servidor en el momento en que esta función corre -- eso es correcto
    // tanto si se llama al instante (con conexión) como si se llama horas
    // después al sincronizar un movimiento que se guardó sin conexión: en
    // ningún caso se confía en un stock que el navegador haya podido
    // cachear.
    if (tipo === "SALIDA" && cantidadEnUnidadBase > Number(material.cantidadActual)) {
      return {
        ok: false,
        error: `No hay suficiente stock: quedan ${material.cantidadActual.toString()} ${material.unidadMedida}.`,
      };
    }

    const montoTotal = costo !== null ? Math.round(cantidad * costo * 100) / 100 : 0;
    const deltaStock = tipo === "ENTRADA" ? cantidadEnUnidadBase : -cantidadEnUnidadBase;

    let compraId: string | null = null;
    if (esCompra) {
      const compra = await tx.compra.create({
        data: {
          ...(idCompra ? { id: idCompra } : {}),
          proveedorId,
          montoTotal,
          notas,
          pagada: !esCredito,
          ...(fecha ? { fecha } : {}),
        },
      });
      compraId = compra.id;

      if (!esCredito) {
        const proveedor = await tx.proveedor.findUnique({ where: { id: proveedorId } });
        await tx.gasto.create({
          data: {
            ...(idGasto ? { id: idGasto } : {}),
            categoria: "MATERIALES",
            monto: montoTotal,
            fecha: compra.fecha,
            compraId: compra.id,
            descripcion: `Compra de ${material.nombre}${proveedor ? ` a ${proveedor.nombre}` : ""}`,
          },
        });
      }
    }

    const movimiento = await tx.movimientoInventario.create({
      data: {
        ...(idMovimiento ? { id: idMovimiento } : {}),
        materialId,
        tipo,
        cantidad,
        cantidadPorUnidad,
        costo,
        compraId,
        notas,
        ...(fecha ? { fecha } : {}),
      },
    });

    await tx.materialInventario.update({
      where: { id: materialId },
      data: {
        cantidadActual: { increment: deltaStock },
        ...(tipo === "ENTRADA" && costo !== null ? { costo } : {}),
      },
    });

    return {
      ok: true,
      movimientoId: movimiento.id,
      compraId,
      nuevo: true,
      materialNombre: material.nombre,
      montoTotal,
    };
  });

  if (!resultado.ok) return { error: resultado.error };

  // Solo se audita cuando esta llamada de verdad creó algo -- el no-op de
  // un reintento ya se auditó la primera vez que sí se creó.
  if (resultado.nuevo) {
    const sufijoOffline = sincronizadoOffline ? " (registrado sin conexión, sincronizado después)" : "";
    await registrarAuditoria({
      accion: "crear",
      entidad: "MovimientoInventario",
      entidadId: resultado.movimientoId,
      detalle: `${tipo} de ${resultado.materialNombre} (${cantidad}${esCompra ? `, compra L. ${resultado.montoTotal}` : ""})${sufijoOffline}`,
    });
  }

  return { movimientoId: resultado.movimientoId, compraId: resultado.compraId };
}
