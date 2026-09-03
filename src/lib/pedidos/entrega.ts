import "server-only";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { fechaDesdeInputHonduras } from "@/lib/fecha";

export type CrearEntregaInput = {
  pedidoId: string;
  /** yyyy-mm-dd, mismo formato que el <input type="date"> del formulario. */
  fechaProgramadaInput: string;
  notas: string | null;
  /** Ver mismo campo en riego.ts -- upsert-por-id, sin efectos secundarios. */
  idEntrega?: string;
  fecha?: Date;
  sincronizadoOffline?: boolean;
};

export type CrearEntregaResultado =
  | { error: string; entregaId?: undefined }
  | { error?: undefined; entregaId: string };

/**
 * Lógica compartida de "programar una entrega" -- sin efectos secundarios
 * en otra tabla, upsert-por-id igual que riego.ts.
 *
 * Fuera de alcance a propósito (quedan solo con Server Action, requieren
 * conexión): marcar una entrega como completada/cancelada
 * (actualizarEstadoEntrega) y borrar una entrega (eliminarEntrega) --
 * ediciones de un registro que ya existe, no la bitácora de uso diario.
 */
export async function crearEntregaCompartido(
  input: CrearEntregaInput
): Promise<CrearEntregaResultado> {
  const { pedidoId, fechaProgramadaInput, notas, idEntrega, fecha, sincronizadoOffline } = input;

  if (!pedidoId) return { error: "Falta el pedido." };

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId }, select: { id: true } });
  if (!pedido) return { error: "Ese pedido ya no existe." };

  const fechaProgramada = fechaDesdeInputHonduras(fechaProgramadaInput);
  const datos = {
    pedidoId,
    fechaProgramada,
    notas,
    ...(fecha ? { creadoEn: fecha } : {}),
  };

  const yaExistia = idEntrega
    ? Boolean(await prisma.entrega.findUnique({ where: { id: idEntrega }, select: { id: true } }))
    : false;

  const entrega = idEntrega
    ? await prisma.entrega.upsert({
        where: { id: idEntrega },
        create: { id: idEntrega, ...datos },
        update: {},
      })
    : await prisma.entrega.create({ data: datos });

  if (!yaExistia) {
    const sufijoOffline = sincronizadoOffline
      ? " (registrado sin conexión, sincronizado después)"
      : "";
    await registrarAuditoria({
      accion: "crear",
      entidad: "Entrega",
      entidadId: entrega.id,
      detalle: `${pedidoId}${sufijoOffline}`,
    });
  }

  return { entregaId: entrega.id };
}
