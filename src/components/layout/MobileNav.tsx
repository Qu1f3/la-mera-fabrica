"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Menú de hamburguesa para el sitio público en pantallas angostas (< sm).
 * Antes de esto, los enlaces de navegación del header (Nosotros, Preguntas
 * frecuentes, Contacto) tenían la clase "hidden sm:flex" y en el teléfono
 * simplemente desaparecían sin ningún botón para abrirlos — solo quedaban
 * alcanzables bajando hasta el pie de página. Este componente es la versión
 * para móvil de esos mismos enlaces.
 */
export function MobileNav({
  enlaces,
}: {
  enlaces: { href: string; label: string }[];
}) {
  const [abierto, setAbierto] = useState(false);

  // Cerrar con Escape, por accesibilidad básica.
  useEffect(() => {
    if (!abierto) return;
    function alEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, [abierto]);

  return (
    <div className="sm:hidden">
      {/*
        Antes era solo el ícono de "hamburguesa" sin ninguna palabra al
        lado — un patrón muy familiar para usuarios jóvenes/técnicos, pero
        que a un adulto mayor o alguien no técnico no siempre le queda claro
        que ahí hay un menú para abrir. Se agregó la palabra "Menú" junto al
        ícono, y se agrandó el botón (antes 36×36px) para que sea más fácil
        de tocar con precisión.
      */}
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        className="flex h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-carbon hover:bg-arena"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-5 w-5"
          aria-hidden="true"
        >
          {abierto ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
        {abierto ? "Cerrar" : "Menú"}
      </button>

      {abierto && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-neutral-200 bg-white px-4 py-3 shadow-sm">
          <nav className="flex flex-col">
            {enlaces.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                onClick={() => setAbierto(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-piedra hover:bg-arena hover:text-terracota"
              >
                {enlace.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
