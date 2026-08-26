"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Modal simple para el panel (confirmaciones, formularios cortos, mensajes
 * de WhatsApp editables). Sin libreria externa -- overlay + Escape para
 * cerrar. `isOpen` lo controla quien use el componente (useState en el
 * padre), no hay estado interno de visibilidad.
 */
export function Modal({
  isOpen,
  onClose,
  titulo,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    function alEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") onClose();
    }
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
