import "server-only";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type RegistrarPagoExtraInput = {
  empleadoId: string;
  tipoPagoExtraId: string | null;
  descripcion: string;
  /**
   * Ya con el signo aplicado (negativo si el tipo elegido resta del pago
   * semanal) -- el navegador ya conoce el signo de cada tipo (es lo mismo
   * dato que usa NuevoPagoExtraForm.tsx para pintar los botones en rojo),
   * así que lo aplica ahí mismo antes de mandarlo, en vez de que esta
   * función tenga que ir a buscarlo a la base -- así funciona igual con o
   * sin conexión.
   */
  monto: number;
  notas: string | null;
  /**
   * Igual que en produccion/registrar.ts: si se pasa (pago que se generó
   * en el navegador sin conexión), se hace upsert por ese id -- reintentar
   * la sincronización no duplica el registro.
   */
  id?: string;
  /** Momento real del registro sin conexión (ver mismo campo en produccion). */
  fecha?: Date;
  sincronizadoOffline?: boolean;
};

export type RegistrarPagoExtraResultado =
  | { error: string; id?: undefined }
  | { error?: undefined; id: string };

/**
 * Lógica compartida de "registrar un pago extra" -- la usa tanto la Server
 * Action (extras/actions.ts, ya no la llama el formulario pero se deja
 * funcionando) como la ruta de API src/app/api/offline/extras/route.ts,
 * que es la que de verdad usa el formulario ahora. Ver
 * propuesta-modo-offline.md.
 */
export async function registrarPagoExtraCompartido(
  input: RegistrarPagoExtraInput
): Promise<RegistrarPagoExtraResultado> {
  const { empleadoId, tipoPagoExtraId, descripcion, monto, notas, id, fecha, sincronizadoOffline } =
    input;

  if (!empleadoId) return { error: "Selecciona un empleado." };
  if (!descripcion) return { error: "La descripción es obligatoria." };
  if (!Number.isFinite(monto)) return { error: "El monto no es válido." };

  const datos = {
    empleadoId,
    tipoPagoExtraId,
    descripcion,
    monto,
    notas,
    ...(fecha ? { fecha } : {}),
  };

  const pago = id
    ? await prisma.pagoExtraEmpleado.upsert({
        where: { id },
        create: { id, ...datos },
        update: {},
      })
    : await prisma.pagoExtraEmpleado.create({ data: datos });

  const sufijoOffline = sincronizadoOffline
    ? " (registrado sin conexión, sincronizado después)"
    : "";
  await registrarAuditoria({
    accion: "crear",
    entidad: "PagoExtraEmpleado",
    entidadId: pago.id,
    detalle: `${descripcion} (L. ${monto})${sufijoOffline}`,
  });

  return { id: pago.id };
}
