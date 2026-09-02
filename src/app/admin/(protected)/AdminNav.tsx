"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { RolAdmin } from "@prisma/client";

type Enlace = { href: string; label: string; icono: string };
type Grupo = { titulo: string; enlaces: Enlace[] };

// Secciones que SÍ puede ver un AdminUsuario con rol EMPLEADO (el "mini
// administrador" -- ver src/lib/supabase/adminUsuario.ts). El bloqueo real
// de las demás vive en "(solo-dueno)/layout.tsx"; esta lista es solo para
// que el menú no le muestre enlaces a los que de todos modos no puede
// entrar. Debe coincidir con las secciones que quedaron FUERA del route
// group "(solo-dueno)".
const RUTAS_EMPLEADO = [
  "/admin/pedidos",
  "/admin/produccion",
  "/admin/extras",
  "/admin/pagos-semanales",
  "/admin/inventario",
  "/admin/reportes",
];

const GRUPOS_NAV: Grupo[] = [
  {
    titulo: "Principal",
    enlaces: [
      { href: "/admin", label: "Inicio", icono: "🏠" },
      { href: "/admin/pedidos", label: "Pedidos", icono: "📦" },
      { href: "/admin/clientes", label: "Clientes", icono: "👥" },
      { href: "/admin/cotizaciones", label: "Cotizaciones", icono: "💬" },
    ],
  },
  {
    titulo: "Operación",
    enlaces: [
      { href: "/admin/produccion", label: "Producción", icono: "🏭" },
      { href: "/admin/extras", label: "Extras", icono: "➕" },
      { href: "/admin/empleados", label: "Empleados", icono: "👷" },
      { href: "/admin/pagos-semanales", label: "Pagos semanales", icono: "💵" },
      { href: "/admin/calendario", label: "Calendario", icono: "📅" },
      { href: "/admin/inventario", label: "Inventario", icono: "📦" },
      { href: "/admin/finanzas", label: "Finanzas", icono: "💰" },
      { href: "/admin/reportes", label: "Reportes", icono: "📊" },
      { href: "/admin/auditoria", label: "Auditoría", icono: "🔍" },
    ],
  },
  {
    titulo: "Sitio web",
    enlaces: [
      { href: "/admin/productos", label: "Productos", icono: "🛍️" },
      { href: "/admin/categorias", label: "Categorías", icono: "🗂️" },
      { href: "/admin/contenido", label: "Contenido", icono: "📝" },
      { href: "/admin/configuracion", label: "Configuración", icono: "⚙️" },
    ],
  },
];

function gruposParaRol(rol: RolAdmin): Grupo[] {
  if (rol === "ADMIN") return GRUPOS_NAV;
  return GRUPOS_NAV.map((grupo) => ({
    ...grupo,
    enlaces: grupo.enlaces.filter((enlace) => RUTAS_EMPLEADO.includes(enlace.href)),
  })).filter((grupo) => grupo.enlaces.length > 0);
}

function estaActivo(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ListaEnlaces({
  grupos,
  pathname,
  onClicEnlace,
}: {
  grupos: Grupo[];
  pathname: string;
  onClicEnlace?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-5">
      {grupos.map((grupo) => (
        <div key={grupo.titulo}>
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {grupo.titulo}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {grupo.enlaces.map((enlace) => {
              const activo = estaActivo(pathname, enlace.href);
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  onClick={onClicEnlace}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activo
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  <span aria-hidden="true">{enlace.icono}</span>
                  {enlace.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/**
 * Navegación del panel: sidebar fija en desktop, menú deslizable ("Menú" +
 * ícono, mismo patrón de amigabilidad que MobileNav.tsx del sitio público)
 * en tablet/móvil, donde una sola fila de ~12 enlaces ya no entra ni con
 * scroll horizontal.
 */
export function AdminNav({
  userEmail,
  rol,
  signOutAction,
}: {
  userEmail: string;
  rol: RolAdmin;
  signOutAction: () => void;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const grupos = gruposParaRol(rol);

  return (
    <>
      {/* Barra superior de móvil/tablet */}
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-emblema.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 flex-shrink-0"
            priority
          />
          <p className="text-sm font-semibold text-neutral-900">La Mera Fábrica</p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="flex h-11 items-center gap-1.5 rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-700"
        >
          <span aria-hidden="true">☰</span>
          Menú
        </button>
      </header>

      {/* Menú deslizable de móvil/tablet */}
      {abierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">Menú</p>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
                className="flex h-11 w-11 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <ListaEnlaces grupos={grupos} pathname={pathname} onClicEnlace={() => setAbierto(false)} />
            </div>
            <div className="mt-6 border-t border-neutral-200 pt-4">
              <p className="truncate px-3 text-xs text-neutral-500">{userEmail}</p>
              <form action={signOutAction} className="mt-2 px-3">
                <button
                  type="submit"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar fija de desktop */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-4">
          <Image
            src="/logo-emblema.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 flex-shrink-0"
            priority
          />
          <div>
            <p className="text-sm font-semibold text-neutral-900">La Mera Fábrica</p>
            <p className="text-xs text-neutral-500">Panel administrativo</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <ListaEnlaces grupos={grupos} pathname={pathname} />
        </div>
        <div className="border-t border-neutral-200 p-3">
          <p className="truncate px-1 text-xs text-neutral-500">{userEmail}</p>
          <form action={signOutAction} className="mt-2">
            <button
              type="submit"
              className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
