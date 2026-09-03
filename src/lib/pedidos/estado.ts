import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import type { EstadoPedido } from "@/lib/types";
import { resumenParaConflicto, type ConflictoPedidoServidor } from "./conflicto";

export type CambiarEstadoPedidoInput = {
  pedidoId: string;
  estado: EstadoPedido;
  notas: string | null;
  adminUsuarioId: string;
  /**
   * ID a usar para la fila de HistorialEstadoPedido -- si se pasa (cambio
   * hecho en el navegador sin conexión), esta función se vuelve idempotente
   * por idHistorial: si ya existe una fila con ese id, es un reintento de
   * un cambio que ya se aplicó, y se devuelve tal cual sin tocar nada más
   * (ni el estado del pedido, ni el ingreso automático de pago final) --
   * mismo criterio que idMovimiento en inventario/registrar.ts.
   */
  idHistorial?: string;
  /**
   * Pedido.actualizadoEn (ISO) tal como lo vio el dispositivo la última
   * vez que cargó este pedido. Si al momento de aplicar el cambio el
   * valor real en el servidor ya es distinto, significa que alguien más
   * (el otro dispositivo) cambió el pedido mientras este estaba sin
   * conexión -- en ese caso NO se aplica el cambio a la fuerza, se
   * devuelve el conflicto para que la persona decida manualmente (ver
   * propuesta-modo-offline.md, "qué pasa si dos dispositivos sin conexión
   * editan el mismo pedido"). Si no se pasa (edición normal, con
   * conexión), no se compara nada.
   */
  versionEsperada?: string;
  /** El usuario ya vio el conflicto y decidió aplicar su cambio de todas formas. */
  forzar?: boolean;
  fecha?: Date;
  sincronizadoOffline?: boolean;
};

export type CambiarEstadoPedidoResultado =
  | { error: string; conflicto?: undefined; codigo?: undefined }
  | { error?: undefined; conflicto: ConflictoPedidoServidor; codigo?: undefined }
  | { error?: undefined; conflicto?: undefined; codigo: string };

type ResultadoTx =
  | { ok: false; error: string }
  | { ok: false; conflicto: ConflictoPedidoServidor }
  | { ok: true; codigo: string; nuevo: boolean };

/**
 * Lógica compartida de "cambiar el estado de un pedido" -- la usa tanto la
 * Server Action (pedidos/actions.ts) como
 * src/app/api/offline/pedidos/estado/route.ts. Ver estado de conflicto
 * arriba y propuesta-modo-offline.md, Fase 4.
 */
export async function cambiarEstadoPedidoCompartido(
  input: CambiarEstadoPedidoInput
): Promise<CambiarEstadoPedidoResultado> {
  const {
    pedidoId,
    estado,
    notas,
    adminUsuarioId,
    idHistorial,
    versionEsperada,
    forzar,
    fecha,
    sincronizadoOffline,
  } = input;

  const resultado: ResultadoTx = await prisma.$transaction(async (tx) => {
    const pedidoActual = await tx.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedidoActual) return { ok: false, error: "Ese pedido ya no existe." };

    // Reintento de un cambio que ya se aplicó (la respuesta se perdió
    // justo al reconectar, por ejemplo) -- no-op idempotente. Se detecta
    // ANTES de comparar la versión: si ya se aplicó, comparar la versión
    // otra vez daría un falso conflicto (el propio cambio ya la movió).
    if (idHistorial) {
      const yaExiste = await tx.historialEstadoPedido.findUnique({ where: { id: idHistorial } });
      if (yaExiste) {
        return { ok: true, codigo: pedidoActual.codigo, nuevo: false };
      }
    }

    if (!forzar && versionEsperada && pedidoActual.actualizadoEn.toISOString() !== versionEsperada) {
      return { ok: false, conflicto: resumenParaConflicto(pedidoActual) };
    }

    const data: Prisma.PedidoUpdateInput = { estado };
    // Estos dos campos se completan solos al llegar al estado
    // correspondiente -- nunca se piden a mano.
    if (estado === "EN_SECADO") data.fechaInicioSecado = fecha ?? new Date();
    if (estado === "ENTREGADO") data.fechaEntregaReal = fecha ?? new Date();

    await tx.pedido.update({ where: { id: pedidoId }, data });
    await tx.historialEstadoPedido.create({
      data: {
        ...(idHistorial ? { id: idHistorial } : {}),
        pedidoId,
        estado,
        adminUsuarioId,
        notas,
        ...(fecha ? { creadoEn: fecha } : {}),
      },
    });

    // Ingreso automático: al llegar a ENTREGADO se asume cobrado el saldo
    // que quedaba pendiente. Se busca primero para no duplicarlo si el
    // pedido pasa por ENTREGADO más de una vez (se corrige el estado y se
    // vuelve a marcar) -- esta comprobación YA era idempotente en el
    // original, se deja igual.
    if (estado === "ENTREGADO" && Number(pedidoActual.saldoPendiente) > 0) {
      const yaExisteIngreso = await tx.ingreso.findFirst({
        where: { pedidoId, categoria: "PAGO_FINAL" },
      });
      if (!yaExisteIngreso) {
        await tx.ingreso.create({
          data: {
            categoria: "PAGO_FINAL",
            monto: pedidoActual.saldoPendiente,
            fecha: fecha ?? new Date(),
            pedidoId,
            descripcion: `Pago final de pedido ${pedidoActual.codigo}`,
          },
        });
      }
    }

    return { ok: true, codigo: pedidoActual.codigo, nuevo: true };
  });

  if (!resultado.ok) {
    if ("conflicto" in resultado) return { conflicto: resultado.conflicto };
    return { error: resultado.error };
  }

  if (resultado.nuevo) {
    const sufijoOffline = sincronizadoOffline
      ? " (registrado sin conexión, sincronizado después)"
      : "";
    await registrarAuditoria({
      accion: "cambiar_estado",
      entidad: "Pedido",
      entidadId: pedidoId,
      detalle: `${resultado.codigo} -> ${estado}${sufijoOffline}`,
    });
  }

  return { codigo: resultado.codigo };
}
