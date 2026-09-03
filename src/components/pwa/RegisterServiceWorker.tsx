"use client";

import { useEffect } from "react";

// Registra el service worker SOLO dentro de /admin (scope explícito) -- el
// sitio público de catálogo no se instala como app, así que no necesita
// esto. Desde la Fase 1 de "modo sin conexión" (ver
// propuesta-modo-offline.md), public/sw.js SÍ cachea (antes, a propósito,
// no cacheaba nada) -- ver los comentarios de ese archivo para el detalle
// de qué guarda y por qué.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/admin/",
        // Evita que el propio navegador cachee el archivo sw.js por HTTP
        // (aparte del caché de Cache Storage que maneja el service worker
        // mismo) -- si no, un despliegue nuevo puede tardar en notarse.
        updateViaCache: "none",
      })
      .catch(() => {
        // Si falla (ej. navegador viejo, o corriendo en http sin TLS),
        // el panel sigue funcionando normal como página web -- solo no se
        // podrá "instalar" como app ni funcionar sin conexión.
      });
  }, []);

  return null;
}
