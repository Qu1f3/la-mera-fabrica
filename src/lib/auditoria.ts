import "server-only";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Registra una accion sensible (borrar, marcar pagado/pendiente, cambiar
 * estado) en la bitacora de auditoria (RegistroAuditoria) -- quien la hizo
 * (correo de la sesion de Supabase) y cuando.
 *
 * Best-effort a proposito: se llama al FINAL de cada Server Action, despues
 * de que la operacion real ya se hizo, y nunca debe tumbarla si el registro
 * de auditoria falla (ej. problema de red puntual) -- por eso se traga
 * cualquier error en vez de dejarlo propagar.
 */
export async function registrarAuditoria(datos: {
  accion: string;
  entidad: string;
  entidadId?: string;
  detalle?: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await prisma.registroAuditoria.create({
      data: {
        usuarioEmail: user?.email ?? "desconocido",
        accion: datos.accion,
        entidad: datos.entidad,
        entidadId: datos.entidadId,
        detalle: datos.detalle,
      },
    });
  } catch {
    // Best-effort: un fallo al auditar nunca debe bloquear la accion real.
  }
}
