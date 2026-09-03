import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { generarCodigoPedido } from "@/lib/pedidoCodigo";
import {
  calcularSubtotal,
  calcularTotalesPedido,
  type EntradaAnticipo,
} from "@/lib/pedidoTotales";
import { fechaDesdeInputHonduras } from "@/lib/fecha";

export type ItemPedidoInput = {
  productoId: string;
  categoria: string | null;
  diseno: string | null;
  color: string | null;
  cantidad: number;
  precioUnitario: number;
};

export type RegistrarPedidoInput = {
  /** Quién queda como autor de la primera entrada de historial (PEDIDO_RECIBIDO). */
  adminUsuarioId: string;
  clienteId?: string;
  /**
   * Cliente nuevo creado en el mismo paso -- reemplaza el flujo anterior de
   * dos Server Actions separadas (crearClienteInline + crearPedido), que no
   * podía funcionar sin conexión porque cada una necesitaba su propio viaje
   * al servidor antes de poder seguir con la siguiente. Ahora todo -- crear
   * el cliente (si hace falta) y crear el pedido -- pasa en una sola
   * llamada a esta función, dentro de la misma transacción.
   */
  clienteNuevo?: { id?: string; nombre: string; telefono: string };
  items: ItemPedidoInput[];
  modoAnticipo: "PORCENTAJE" | "MONTO_FIJO";
  porcentajeAnticipo?: number;
  montoAnticipoFijo?: number;
  /** yyyy-mm-dd, mismo formato que el <input type="date"> del formulario. */
  fechaPrometidaInput?: string | null;
  notas: string | null;
  /**
   * IDs a usar para el Pedido/Ingreso -- igual que en produccion/registrar.ts,
   * extras/registrar.ts e inventario/registrar.ts: si se pasan (pedido creado
   * en el navegador sin conexión), esta función se vuelve idempotente por
   * idPedido (ver más abajo). Con conexión, se dejan sin pasar y Prisma
   * genera cuid() nuevos como siempre.
   */
  idPedido?: string;
  idIngreso?: string;
  /**
   * Código de pedido generado en el navegador (ver
   * src/lib/pedidoCodigoCliente.ts) -- solo aplica a pedidos creados sin
   * conexión, donde no se puede consultar la base para garantizar que sea
   * único antes de guardarlo. Si no se pasa, se genera acá igual que
   * siempre (con la verificación contra la base de src/lib/pedidoCodigo.ts).
   */
  codigo?: string;
  /** Momento real en que se creó el pedido sin conexión (ver mismo campo en produccion/extras/inventario). */
  fecha?: Date;
  sincronizadoOffline?: boolean;
};

export type RegistrarPedidoResultado =
  | { error: string; pedidoId?: undefined; codigo?: undefined }
  | { error?: undefined; pedidoId: string; codigo: string };

type ResultadoTx =
  | { ok: false; error: string }
  | {
      ok: true;
      pedidoId: string;
      codigo: string;
      /** true solo si esta llamada creó el pedido de verdad (no un reintento no-op). */
      nuevo: boolean;
      cantidadItems: number;
      montoTotal: number;
    };

function esColisionDeCodigo(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Lógica compartida de "crear un pedido" (con cliente existente o cliente
 * nuevo en el mismo paso) -- la usa tanto la Server Action
 * (pedidos/actions.ts, ya no la llama el formulario pero se deja
 * funcionando) como la ruta de API src/app/api/offline/pedidos/route.ts.
 * Ver propuesta-modo-offline.md, Fase 4.
 *
 * IMPORTANTE sobre idempotencia: crear un pedido SÍ tiene efectos
 * secundarios -- opcionalmente crea un Cliente, y si hay anticipo crea
 * también un Ingreso automático. Igual que en
 * src/lib/inventario/registrar.ts, un simple upsert por id no alcanza
 * (el Ingreso se crea con una llamada aparte, fuera de los datos anidados
 * del Pedido, así que un upsert no evitaría que se duplicara en un
 * reintento). Por eso, cuando viene idPedido, la función primero revisa si
 * ese pedido YA existe -- si existe, no se toca nada más (ni Cliente, ni
 * Ingreso), se devuelve tal cual quedó la primera vez (no-op idempotente);
 * solo si no existía se hace el trabajo real.
 */
export async function registrarPedidoCompartido(
  input: RegistrarPedidoInput
): Promise<RegistrarPedidoResultado> {
  const {
    adminUsuarioId,
    clienteId: clienteIdDado,
    clienteNuevo,
    items,
    modoAnticipo,
    porcentajeAnticipo: porcentajeAnticipoInput,
    montoAnticipoFijo,
    fechaPrometidaInput,
    notas,
    idPedido,
    idIngreso,
    codigo: codigoDado,
    fecha,
    sincronizadoOffline,
  } = input;

  if (!clienteIdDado && !clienteNuevo) {
    return { error: "Selecciona o crea un cliente." };
  }
  if (clienteNuevo && (!clienteNuevo.nombre.trim() || !clienteNuevo.telefono.trim())) {
    return { error: "El nombre y teléfono del cliente nuevo son obligatorios." };
  }
  if (!items || items.length === 0) {
    return { error: "Agrega al menos un producto con cantidad y precio válidos." };
  }
  for (const item of items) {
    if (
      !item.productoId ||
      typeof item.cantidad !== "number" ||
      !(item.cantidad > 0) ||
      typeof item.precioUnitario !== "number" ||
      item.precioUnitario < 0
    ) {
      return { error: "Agrega al menos un producto con cantidad y precio válidos." };
    }
  }

  let entradaAnticipo: EntradaAnticipo;
  if (modoAnticipo === "MONTO_FIJO") {
    const monto = Number(montoAnticipoFijo);
    if (!Number.isFinite(monto) || monto < 0) {
      return { error: "El monto de anticipo no es válido." };
    }
    const montoTotalItems = items.reduce(
      (suma, item) => suma + item.cantidad * item.precioUnitario,
      0
    );
    if (monto > montoTotalItems) {
      return { error: "El anticipo no puede ser mayor que el total del pedido." };
    }
    entradaAnticipo = { modo: "MONTO_FIJO", monto };
  } else {
    const porcentajeRaw = Number(porcentajeAnticipoInput);
    const porcentaje = Number.isFinite(porcentajeRaw) ? porcentajeRaw : 60;
    if (porcentaje < 0 || porcentaje > 100) {
      return { error: "El porcentaje de anticipo debe estar entre 0 y 100." };
    }
    entradaAnticipo = { modo: "PORCENTAJE", porcentaje };
  }

  const fechaPrometida = fechaDesdeInputHonduras(fechaPrometidaInput ?? undefined);
  const { montoTotal, montoAnticipo, porcentajeAnticipo, saldoPendiente } =
    calcularTotalesPedido(items, entradaAnticipo);

  const resultado: ResultadoTx = await prisma.$transaction(async (tx) => {
    // Reintento de un pedido que ya se sincronizó antes (la respuesta se
    // perdió justo al reconectar, por ejemplo) -- no-op idempotente, ver
    // comentario grande arriba. Se detecta ANTES de tocar nada más (ni
    // Cliente, ni Ingreso).
    if (idPedido) {
      const existente = await tx.pedido.findUnique({ where: { id: idPedido } });
      if (existente) {
        return {
          ok: true,
          pedidoId: existente.id,
          codigo: existente.codigo,
          nuevo: false,
          cantidadItems: 0,
          montoTotal: 0,
        };
      }
    }

    let clienteId = clienteIdDado ?? "";
    if (clienteNuevo) {
      const cliente = await tx.cliente.create({
        data: {
          ...(clienteNuevo.id ? { id: clienteNuevo.id } : {}),
          nombre: clienteNuevo.nombre.trim(),
          telefono: clienteNuevo.telefono.trim(),
        },
      });
      clienteId = cliente.id;
    } else {
      const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
      if (!cliente) return { ok: false, error: "Ese cliente ya no existe." };
    }

    const datosPedido = (codigo: string) => ({
      ...(idPedido ? { id: idPedido } : {}),
      codigo,
      clienteId,
      fechaPrometida,
      porcentajeAnticipo,
      montoAnticipo,
      montoTotal,
      saldoPendiente,
      notas,
      ...(fecha ? { creadoEn: fecha } : {}),
      items: {
        create: items.map((item) => ({
          productoId: item.productoId,
          categoria: item.categoria || null,
          diseno: item.diseno || null,
          color: item.color || null,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: calcularSubtotal(item.cantidad, item.precioUnitario),
        })),
      },
      historial: {
        create: { estado: "PEDIDO_RECIBIDO" as const, adminUsuarioId },
      },
    });

    let codigo = codigoDado || (await generarCodigoPedido());
    let pedido;
    try {
      pedido = await tx.pedido.create({ data: datosPedido(codigo) });
    } catch (error) {
      // Colisión de código -- solo puede pasar de verdad con un código
      // generado en el navegador sin conexión (ver
      // pedidoCodigoCliente.ts), que no pudo verificarse contra la base al
      // momento de crearlo. Con 8 caracteres de un alfabeto de 31 símbolos
      // es extremadamente improbable, pero no imposible -- un solo
      // reintento con un código verificado contra la base alcanza.
      if (!esColisionDeCodigo(error)) throw error;
      codigo = await generarCodigoPedido();
      pedido = await tx.pedido.create({ data: datosPedido(codigo) });
    }

    // Ingreso automático: el anticipo de un pedido nuevo ES un ingreso, no
    // hace falta que alguien lo vuelva a escribir en Finanzas. Ver
    // estado.ts para el ingreso del pago final al entregar.
    if (montoAnticipo > 0) {
      await tx.ingreso.create({
        data: {
          ...(idIngreso ? { id: idIngreso } : {}),
          categoria: "ANTICIPO",
          monto: montoAnticipo,
          fecha: fecha ?? new Date(),
          pedidoId: pedido.id,
          descripcion: `Anticipo de pedido ${codigo}`,
        },
      });
    }

    return {
      ok: true,
      pedidoId: pedido.id,
      codigo,
      nuevo: true,
      cantidadItems: items.length,
      montoTotal,
    };
  });

  if (!resultado.ok) return { error: resultado.error };

  // Igual que en produccion/extras/inventario: la auditoría va DESPUÉS de
  // que la transacción ya confirmó (llama a Supabase auth por red) y solo
  // cuando esta llamada de verdad creó algo -- el no-op de un reintento ya
  // se auditó la primera vez que sí se creó.
  if (resultado.nuevo) {
    const sufijoOffline = sincronizadoOffline
      ? " (registrado sin conexión, sincronizado después)"
      : "";
    await registrarAuditoria({
      accion: "crear",
      entidad: "Pedido",
      entidadId: resultado.pedidoId,
      detalle: `${resultado.codigo}${sufijoOffline}`,
    });
  }

  return { pedidoId: resultado.pedidoId, codigo: resultado.codigo };
}
