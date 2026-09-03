import "server-only";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type RegistrarRiegoInput = {
  pedidoId: string;
  adminUsuarioId: string;
  observacion: string | null;
  /** Ver mismo campo en produccion/registrar.ts -- upsert-por-id, sin efectos secundarios. */
  idRiego?: string;
  fecha?: Date;
  sincronizadoOffline?: boolean;
};

export type RegistrarRiegoResultado =
  | { error: string; riegoId?: undefined }
  | { error?: undefined; riegoId: string };

/**
 * Lógica compartida de "registrar un riego" -- sin efectos secundarios en
 * otra tabla, así que un simple upsert-por-id alcanza para que reintentar
 * la sincronización sea seguro (igual que RegistroProduccion).
 */
export async function registrarRiegoCompartido(
  input: RegistrarRiegoInput
): Promise<RegistrarRiegoResultado> {
  const { pedidoId, adminUsuarioId, observacion, idRiego, fecha, sincronizadoOffline } = input;

  if (!pedidoId) return { error: "Falta el pedido." };

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId }, select: { id: true } });
  if (!pedido) return { error: "Ese pedido ya no existe." };

  const datos = {
    pedidoId,
    adminUsuarioId,
    observacion,
    ...(fecha ? { creadoEn: fecha } : {}),
  };

  const yaExistia = idRiego
    ? Boolean(await prisma.registroRiego.findUnique({ where: { id: idRiego }, select: { id: true } }))
    : false;

  const riego = idRiego
    ? await prisma.registroRiego.upsert({
        where: { id: idRiego },
        create: { id: idRiego, ...datos },
        update: {},
      })
    : await prisma.registroRiego.create({ data: datos });

  if (!yaExistia) {
    const sufijoOffline = sincronizadoOffline
      ? " (registrado sin conexión, sincronizado después)"
      : "";
    await registrarAuditoria({
      accion: "crear",
      entidad: "RegistroRiego",
      entidadId: riego.id,
      detalle: (observacion ?? undefined) && `${observacion}${sufijoOffline}`,
    });
  }

  return { riegoId: riego.id };
}
