"use client";

import Link from "next/link";
import { useEffect } from "react";

// Red de seguridad para el sitio público -- sin esto, un error inesperado
// (por ejemplo la base de datos caída un momento) muestra la pantalla de
// error genérica de Next.js en vez de algo con la marca del sitio, mismo
// criterio que los not-found.tsx de /productos/[slug] y /estado-pedido.
// `error.tsx` es obligatoriamente un componente cliente (usa un error
// boundary de React) y recibe `reset()` para reintentar sin recargar todo.
export default function ErrorSitioPublico({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        Algo salió mal
      </h1>
      <p className="mt-2 text-sm text-piedra">
        Tuvimos un problema para cargar esta página. Intenta de nuevo en un
        momento.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-terracota px-5 py-2.5 text-sm font-medium text-white hover:bg-terracota-dark"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="rounded-md border border-piedra px-5 py-2.5 text-sm font-medium text-carbon hover:bg-arena"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
