"use client";

import { useToast } from "./Toast";

/**
 * Botón chico para copiar un texto al portapapeles (código de pedido,
 * enlace del tracker, etc.) con confirmación por Toast en vez de un
 * alert(). Requiere estar dentro de <ToastProvider> (ver layout protegido).
 */
export function CopiarBoton({
  valor,
  etiqueta,
  mensajeExito,
}: {
  valor: string;
  etiqueta: string;
  mensajeExito: string;
}) {
  const { mostrarToast } = useToast();

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      mostrarToast(mensajeExito);
    } catch {
      mostrarToast("No se pudo copiar. Cópialo manualmente.", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
    >
      {etiqueta}
    </button>
  );
}
