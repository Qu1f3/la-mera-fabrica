import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/admin/login";

/**
 * Refresca la sesión de Supabase en cada request y protege las rutas /admin.
 * La usa src/proxy.ts (el Proxy de Next.js — antes llamado "middleware").
 *
 * Nota deliberada de alcance (Fase 1): esto valida que exista una sesión de
 * Supabase válida. No exige además una fila en `AdminUsuario` — con un solo
 * administrador eso sería un paso de más antes de poder entrar la primera
 * vez. La tabla ya existe en el esquema para cuando haya más de un rol.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // No ejecutar lógica entre createServerClient y getUser(): un error aquí
  // puede provocar cierres de sesión aleatorios e intermitentes.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX);
  const isLoginRoute = pathname.startsWith(LOGIN_PATH);

  if (isAdminRoute && !isLoginRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_PREFIX;
    url.searchParams.delete("redirectTo");
    return NextResponse.redirect(url);
  }

  return response;
}
