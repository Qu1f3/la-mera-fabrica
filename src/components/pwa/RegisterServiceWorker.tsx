"use client";

import { useEffect } from "react";

// Registra el service worker SOLO dentro de /admin (scope explícito) -- el
// sitio público de catálogo no se instala como app, así que no necesita
// esto. Ver public/sw.js para qué hace (nada de caché a propósito).
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/admin/" })
      .catch(() => {
        // Si falla (ej. navegador viejo, o corriendo en http sin TLS),
        // el panel sigue funcionando normal como página web -- solo no se
        // podrá "instalar" como app.
      });
  }, []);

  return null;
}
