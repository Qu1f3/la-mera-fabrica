import "server-only";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { fechaDesdeInputHonduras } from "@/lib/fecha";
import { resumenParaConflicto, type ConflictoPedidoServidor } from "./conflicto";

export type AsignarFechaPrometidaInput = {
  pedidoId: string;
  /** yyyy-mm-dd, mismo formato que el <input type="date"> del formulario. */
  fechaPrometidaInput: string;
  /** Ver el mismo campo en estado.ts -- misma idea de conflicto manual. */
  versionEsperada?: string;
  forzar?: boolean;
  sincronizadoOffline?: boolean;
};

export type AsignarFechaPrometidaResultado =
  | { error: string; conflicto?: undefined }
  | { error?: undefined; conflicto: ConflictoPedidoServidor }
  | { error?: undefined; conflicto?: undefined };

/**
 * Lógica compartida de "asignar la fecha prometida de un pedido". A
 * diferencia de cambiarEstadoPedidoCompartido, esta edición no tiene
 * ningún efecto secundario (no crea ingresos ni entradas de historial),
 * así que no hace falta un id de idempotencia -- escribir la misma fecha
 * dos veces es, en la práctica, un no-op seguro. Por eso mismo, cuando la
 * fecha pedida YA es la que tiene el pedido en el servidor, esta función
 * no lo trata como conflicto aunque la versión no coincida -- eso es
 * exactamente lo que pasa en un reintento normal después de que la
 * primera llamada sí tuvo éxito pero la respuesta se perdió.
 */
export async function asignarFechaPrometidaCompartido(
  input: AsignarFechaPrometidaInput
): Promise<AsignarFechaPrometidaResultado> {
  const { pedidoId, fechaPrometidaInput, versionEsperada, forzar, sincronizadoOffline } = input;

  // Mismo criterio que la Server Action original: esta pantalla no ofrece
  // "quitar" la fecha prometida, solo asignar una válida -- una fecha vacía
  // o mal formada es un error, no un "sin asignar" implícito.
  const fechaPrometida = fechaDesdeInputHonduras(fechaPrometidaInput);
  if (!fechaPrometida) {
    return { error: "La fecha no es válida." };
  }

  type ResultadoTx =
    | { ok: false; error: string; conflicto?: undefined }
    | { ok: false; conflicto: ConflictoPedidoServidor; error?: undefined }
    | { ok: true; cambio: boolean };

  const resultado: ResultadoTx = await prisma.$transaction(async (tx) => {
    const pedidoActual = await tx.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedidoActual) return { ok: false, error: "Ese pedido ya no existe." };

    const yaTieneEseValor =
      (pedidoActual.fechaPrometida?.getTime() ?? null) === (fechaPrometida?.getTime() ?? null);

    if (
      !yaTieneEseValor &&
      !forzar &&
      versionEsperada &&
      pedidoActual.actualizadoEn.toISOString() !== versionEsperada
    ) {
      return { ok: false, conflicto: resumenParaConflicto(pedidoActual) };
    }

    if (yaTieneEseValor) return { ok: true, cambio: false };

    await tx.pedido.update({ where: { id: pedidoId }, data: { fechaPrometida } });
    return { ok: true, cambio: true };
  });

  if (!resultado.ok) {
    if (resultado.conflicto) return { conflicto: resultado.conflicto };
    return { error: resultado.error };
  }

  // Solo se audita cuando esta llamada de verdad cambió algo -- el no-op
  // de un reintento (misma fecha que ya tenía) ya se auditó la primera vez.
  if (resultado.cambio) {
    const sufijoOffline = sincronizadoOffline
      ? " (registrado sin conexión, sincronizado después)"
      : "";
    await registrarAuditoria({
      accion: "editar",
      entidad: "Pedido",
      entidadId: pedidoId,
      detalle: `fecha prometida${sufijoOffline}`,
    });
  }

  return {};
}
