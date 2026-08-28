import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminUsuario } from "@/lib/supabase/adminUsuario";
import { ToastProvider } from "@/components/admin/ui/Toast";
import { AdminNav } from "./AdminNav";
import { signOut } from "./actions";

// El Proxy (src/proxy.ts) ya redirige a /admin/login si no hay sesión. Esta
// verificación es una segunda capa de defensa, tal como recomienda la
// documentación de Next.js: no depender únicamente del Proxy para proteger
// contenido sensible.
export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Se resuelve acá (una vez por carga de página, para TODO /admin) para
  // que AdminNav sepa qué secciones mostrar según el rol -- el bloqueo real
  // de las secciones de solo-ADMIN vive en
  // "(solo-dueno)/layout.tsx"/requireRolAdmin(), esto es solo para que el
  // menú no le muestre a un EMPLEADO enlaces a los que de todos modos no
  // puede entrar.
  const adminUsuario = await obtenerAdminUsuario(user);

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-neutral-50 md:flex-row">
        <AdminNav
          userEmail={user.email ?? ""}
          rol={adminUsuario.rol}
          signOutAction={signOut}
        />
        <div className="min-w-0 flex-1">
          <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
