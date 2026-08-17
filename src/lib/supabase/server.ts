import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para usar en Server Components, Server Actions y Route
 * Handlers. Hay que crear uno nuevo en cada request — nunca compartirlo entre
 * peticiones (ver documentación de @supabase/ssr).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` fue llamado desde un Server Component (no desde una
            // Server Action o Route Handler). Se puede ignorar siempre que
            // `src/proxy.ts` esté refrescando la sesión en cada request.
          }
        },
      },
    }
  );
}
