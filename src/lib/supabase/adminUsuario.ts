import "server-only";
import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve la fila AdminUsuario del usuario de Supabase que llama, creándola
 * en el momento si todavía no existe.
 *
 * La Fase 1 de autenticación (ver src/lib/supabase/proxy.ts) exige sesión
 * válida de Supabase para entrar a /admin, pero NO exige fila en
 * AdminUsuario -- fue una decisión deliberada para no bloquear el primer
 * ingreso. El sistema de gestión sí necesita saber "qué AdminUsuario
 * específico" hizo cada cambio de estado o cada riego (HistorialEstadoPedido
 * y RegistroRiego lo exigen), así que esta función completa esa fila la
 * primera vez que hace falta, en vez de forzar un paso manual de setup.
 */
export async function obtenerAdminUsuario(user: User) {
  const existente = await prisma.adminUsuario.findUnique({
    where: { authUserId: user.id },
  });
  if (existente) return existente;

  return prisma.adminUsuario.create({
    data: {
      authUserId: user.id,
      email: user.email ?? `${user.id}@sin-correo.local`,
      nombre: user.email?.split("@")[0] ?? "Administrador",
    },
  });
}
