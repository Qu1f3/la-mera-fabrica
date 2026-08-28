// Service worker mínimo del Panel administrativo de La Mera Fábrica.
//
// Su único propósito es cumplir el requisito técnico de Chrome/Android para
// que el sitio se pueda "Instalar como app" (necesita un service worker
// registrado con un manejador de `fetch`, además del manifest). NO
// implementa caché ni modo sin conexión a propósito: el panel siempre
// necesita internet para hablar con Supabase, así que cachear páginas
// podría mostrar datos viejos (pedidos, inventario, etc.) como si fueran
// actuales -- más peligroso que útil para un sistema de gestión.
//
// Si en el futuro se quiere soporte real sin conexión, esto es el lugar
// para agregar un `caches.open(...)` con una estrategia de cache explícita
// (ej. solo para el shell estático, nunca para datos).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
