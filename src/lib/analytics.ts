declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Manda un evento a Google Analytics (GA4) si está configurado. Si el
 * visitante tiene bloqueador de anuncios, o NEXT_PUBLIC_GA_ID no está
 * puesto (ver .env.example), `window.gtag` simplemente no existe — la
 * función no hace nada en vez de fallar. Nunca se llama desde el servidor.
 *
 * Eventos del embudo que usa el sitio: "agregar_cotizacion" (producto
 * agregado al carrito), "enviar_cotizacion" (formulario de cotización
 * enviado) y "clic_whatsapp" (clic en cualquier botón de WhatsApp).
 */
export function trackEvent(nombre: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", nombre, params);
}
