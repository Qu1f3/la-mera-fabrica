"use client";

import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";

/**
 * Si todavía no hay un número de WhatsApp configurado (Configuracion sigue
 * sin llenarse — ver Fase 4), no se muestra ningún botón roto: simplemente
 * no se renderiza nada. Es preferible a un enlace que no lleva a ningún
 * lado.
 *
 * `contexto` es solo para diferenciar en la analítica desde dónde se hizo
 * clic (footer, ficha de producto, etc.) — no cambia nada visual.
 */
export function WhatsAppButton({
  numero,
  mensaje,
  className = "",
  children = "Consultar por WhatsApp",
  contexto = "general",
}: {
  numero: string | null | undefined;
  mensaje: string;
  className?: string;
  children?: React.ReactNode;
  contexto?: string;
}) {
  const url = buildWhatsAppUrl(numero, mensaje);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("clic_whatsapp", { contexto })}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-terracota px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracota-dark ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.1h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.42 5.83c0 4.55-3.71 8.24-8.26 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01-.16 0-.43.06-.66.31-.23.24-.86.85-.86 2.06 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.6.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.28z" />
      </svg>
      {children}
    </a>
  );
}
