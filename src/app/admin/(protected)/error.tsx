"use client";

import { useEffect } from "react";

/**
 * Red de seguridad para cualquier error inesperado dentro del panel
 * administrativo (una consulta que falla, un dato con una forma que no se
 * esperaba, etc.) -- sin esto, Next.js muestra su pantalla de error genérica
 * en vez de algo consistente con el resto del panel. `error.tsx` es
 * obligatoriamente un componente cliente (usa un error boundary de React) y
 * recibe `reset()` para reintentar sin recargar toda la página.
 */
export default function ErrorAdmin({
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
    <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-6">
      <p className="text-sm font-semibold text-red-800">Algo salió mal</p>
      <p className="text-sm text-red-700">
        Ocurrió un error al cargar esta página. Puedes intentar de nuevo; si
        el problema sigue, avísale a Roberto con lo que estabas haciendo.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Reintentar
        </button>
        <a
          href="/admin"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
