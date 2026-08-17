import "server-only";
import { createClient } from "./server";

/**
 * Verifica que haya una sesión de Supabase válida antes de ejecutar una
 * Server Action del panel administrativo.
 *
 * El proxy (`src/proxy.ts` / `src/lib/supabase/proxy.ts`) ya protege la
 * navegación a /admin, pero una Server Action es, en el fondo, un endpoint
 * POST invocable de forma directa — no solo a través de navegar la página.
 * Por eso cada acción del panel vuelve a comprobar la sesión por su cuenta
 * (defensa en profundidad), en vez de depender de una sola capa de
 * protección. Debe ser la primera línea de cualquier Server Action bajo
 * `src/app/admin/(protected)/`.
 *
 * Lanza un error si no hay sesión — quien llama no necesita capturarlo,
 * Next.js lo muestra como un error de servidor, algo que un usuario
 * legítimo del panel nunca debería ver en la práctica.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autorizado.");
  }

  return user;
}
