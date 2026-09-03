import "server-only";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type RegistrarProduccionInput = {
  empleadoId: string;
  /** "" si este registro es solo de mezcla, sin producción. */
  productoId: string;
  cantidadProducida: number;
  unidadesDefectuosas: number;
  notas: string | null;
  hizoMezcla: boolean;
  montoMezcla: number;
  /**
   * IDs a usar para el RegistroProduccion/RegistroMezcla. Si se pasan
   * (registro que se generó en el navegador mientras el dispositivo estaba
   * sin conexión -- ver src/lib/offline/), se hace un upsert por ese ID en
   * vez de un create: si la sincronización se reintenta (ej. la respuesta
   * se perdió justo al reconectar), no se duplica el registro, se vuelve a
   * escribir lo mismo sobre el mismo id sin efecto. Sin conexión de por
   * medio (caso normal, formulario con señal) no se pasan y Prisma genera
   * un cuid() nuevo como siempre.
   */
  idRegistro?: string;
  idMezcla?: string;
  /**
   * Fecha real en la que se hizo el registro, capturada en el dispositivo.
   * Solo se pasa para registros que se hicieron SIN conexión y se están
   * sincronizando después -- así el registro queda fechado cuando
   * realmente pasó, no cuando volvió la señal. Con conexión, se deja que
   * la base use su valor por defecto (now()), más confiable que el reloj
   * del navegador.
   */
  fecha?: Date;
  /** Se anota en la bitácora de auditoría cuando aplica. */
  sincronizadoOffline?: boolean;
};

export type RegistrarProduccionResultado =
  | { error: string; registroId?: undefined; mezclaId?: undefined }
  | { error?: undefined; registroId: string | null; mezclaId: string | null };

/**
 * Lógica compartida de "registrar producción/mezcla" -- la usan tanto la
 * Server Action de src/app/admin/(protected)/produccion/actions.ts (queda
 * viva pero ya no la llama el formulario) como la ruta de API
 * src/app/api/offline/produccion/route.ts, que es la que de verdad usa el
 * formulario ahora (con o sin conexión) -- ver propuesta-modo-offline.md,
 * punto 4, sobre por qué hace falta una ruta de API estable en vez de
 * depender directo de la Server Action para esto.
 */
export async function registrarProduccionCompartido(
  input: RegistrarProduccionInput
): Promise<RegistrarProduccionResultado> {
  const {
    empleadoId,
    productoId,
    cantidadProducida,
    unidadesDefectuosas,
    notas,
    hizoMezcla,
    montoMezcla,
    idRegistro,
    idMezcla,
    fecha,
    sincronizadoOffline,
  } = input;

  if (!empleadoId) return { error: "Selecciona un empleado." };

  const registraProduccion = Boolean(productoId);
  if (!registraProduccion && !hizoMezcla) {
    return { error: "Selecciona un producto o marca que hizo mezcla." };
  }

  let pagoUnitario = 0;
  let totalGanado = 0;

  if (registraProduccion) {
    if (!Number.isInteger(cantidadProducida) || cantidadProducida <= 0) {
      return { error: "La cantidad producida debe ser un número entero mayor a 0." };
    }
    if (!Number.isInteger(unidadesDefectuosas) || unidadesDefectuosas < 0) {
      return { error: "Las unidades defectuosas deben ser un número entero, 0 o más." };
    }
    if (unidadesDefectuosas > cantidadProducida) {
      return { error: "Las unidades defectuosas no pueden ser más que lo producido." };
    }

    const pagoUnitarioProducto = await prisma.pagoUnitarioProducto.findUnique({
      where: { productoId },
    });
    if (!pagoUnitarioProducto) {
      return {
        error:
          "Este producto todavía no tiene un pago unitario configurado. Configúralo primero en \"Pago por unidad\".",
      };
    }

    pagoUnitario = Number(pagoUnitarioProducto.monto);
    const unidadesPagadas = cantidadProducida - unidadesDefectuosas;
    totalGanado = Math.round(unidadesPagadas * pagoUnitario * 100) / 100;
  }

  if (hizoMezcla && (!Number.isFinite(montoMezcla) || montoMezcla <= 0)) {
    return { error: "El monto de mezcla no es válido." };
  }

  const { registroId, mezclaId } = await prisma.$transaction(async (tx) => {
    let registroId: string | null = null;
    let mezclaId: string | null = null;

    if (registraProduccion) {
      const datos = {
        empleadoId,
        productoId,
        cantidadProducida,
        unidadesDefectuosas,
        pagoUnitario,
        totalGanado,
        notas,
        ...(fecha ? { fecha } : {}),
      };
      const registro = idRegistro
        ? await tx.registroProduccion.upsert({
            where: { id: idRegistro },
            create: { id: idRegistro, ...datos },
            update: {},
          })
        : await tx.registroProduccion.create({ data: datos });
      registroId = registro.id;
    }
    if (hizoMezcla) {
      const datos = {
        empleadoId,
        monto: montoMezcla,
        notas,
        ...(fecha ? { fecha } : {}),
      };
      const mezcla = idMezcla
        ? await tx.registroMezcla.upsert({
            where: { id: idMezcla },
            create: { id: idMezcla, ...datos },
            update: {},
          })
        : await tx.registroMezcla.create({ data: datos });
      mezclaId = mezcla.id;
    }

    return { registroId, mezclaId };
  });

  // Los llamados a registrarAuditoria van DESPUES de que la transaccion ya
  // confirmo -- adentro usaria el cliente global de prisma (no `tx`) y
  // ademas llama a Supabase auth por red, lo que dejaria la transaccion
  // interactiva abierta de mas y podria toparse con su timeout (mismo
  // criterio que ya tenía la Server Action original).
  const sufijoOffline = sincronizadoOffline
    ? " (registrado sin conexión, sincronizado después)"
    : "";
  if (registroId) {
    await registrarAuditoria({
      accion: "crear",
      entidad: "RegistroProduccion",
      entidadId: registroId,
      detalle: `${cantidadProducida} unidad(es) -- L. ${totalGanado}${sufijoOffline}`,
    });
  }
  if (mezclaId) {
    await registrarAuditoria({
      accion: "crear",
      entidad: "RegistroMezcla",
      entidadId: mezclaId,
      detalle: `L. ${montoMezcla}${sufijoOffline}`,
    });
  }

  return { registroId, mezclaId };
}
