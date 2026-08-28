import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// A dónde mandar a un usuario con rol EMPLEADO cuando intenta entrar a una
// sección que no le corresponde (o al iniciar sesión). Pedidos es la sección
// más "de entrada" de las que sí puede ver.
const RUTA_INICIO_EMPLEADO = "/admin/pedidos";

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
 *
 * El rol de una fila NUEVA siempre se crea como EMPLEADO (nunca ADMIN) --
 * quien necesite ver todo el panel (hoy solo Roberto) ya tiene su fila
 * creada con rol ADMIN desde antes; si alguien más inicia sesión por primera
 * vez (ej. un nuevo correo dado de alta en Supabase Auth), que empiece con
 * el mínimo acceso y no con acceso total por accidente. Para subir a alguien
 * a ADMIN hay que cambiar el valor a mano en la tabla `admin_usuarios` desde
 * el Table Editor de Supabase -- no hay pantalla para esto en el panel
 * todavía.
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
      rol: "EMPLEADO",
    },
  });
}

/**
 * Guard para las páginas que solo debe poder ver un AdminUsuario con rol
 * ADMIN (Clientes, Cotizaciones, Empleados, Calendario, Finanzas, Productos,
 * Categorías, Contenido, Configuración). Se usa desde
 * `src/app/admin/(protected)/(solo-dueno)/layout.tsx`, que envuelve esas
 * secciones -- así el límite se aplica una sola vez por route group, en vez
 * de repetir la misma llamada en cada page.tsx de esas 9 secciones.
 *
 * Redirige (no lanza error) porque un EMPLEADO llegando aquí no es un caso
 * de error -- es alguien con un enlace viejo, un favorito guardado, o
 * escribiendo la URL directamente; lo correcto es mandarlo a la sección que
 * sí puede ver, sin pantalla de "no autorizado" de por medio.
 */
export async function requireRolAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El Proxy (src/proxy.ts) ya garantiza sesión antes de llegar aquí; esto
  // es la misma segunda capa de defensa que ya usa el layout protegido.
  if (!user) {
    redirect("/admin/login");
  }

  const adminUsuario = await obtenerAdminUsuario(user);
  if (adminUsuario.rol !== "ADMIN") {
    redirect(RUTA_INICIO_EMPLEADO);
  }

  return adminUsuario;
}

export { RUTA_INICIO_EMPLEADO };
