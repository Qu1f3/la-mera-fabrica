import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la service role key: se salta Row Level Security
 * y solo debe usarse en el servidor (Server Actions / Route Handlers), nunca
 * en un componente que pueda terminar en el bundle del navegador. El import
 * de "server-only" hace que el build falle si eso llegara a pasar por error.
 *
 * Se usa para operaciones administrativas que no dependen de la sesión del
 * usuario que inició sesión, como subir imágenes de producto a Storage.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
