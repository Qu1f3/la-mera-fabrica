import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// En Next.js 16 este archivo reemplaza al antiguo `middleware.ts` (renombrado
// a "Proxy"). Corre en casi todas las rutas para poder refrescar la cookie de
// sesión de Supabase; la protección real de /admin vive en updateSession().
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
