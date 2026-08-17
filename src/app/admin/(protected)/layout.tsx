import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

const ENLACES_NAV = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/cotizaciones", label: "Cotizaciones" },
  { href: "/admin/contenido", label: "Contenido" },
  { href: "/admin/configuracion", label: "Configuración" },
];

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

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-emblema.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              La Mera Fábrica
            </p>
            <p className="text-xs text-neutral-500">Panel administrativo</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-600">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <nav className="border-b border-neutral-200 bg-white px-6">
        <div className="mx-auto flex max-w-5xl gap-5">
          {ENLACES_NAV.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="border-b-2 border-transparent py-3 text-sm font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
            >
              {enlace.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
