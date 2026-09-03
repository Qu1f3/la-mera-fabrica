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

    (async () => {
      try {
        // Limpieza de una sola vez: versiones instaladas antes de este
        // cambio quedaron registradas con scope "/admin/" (ver el
        // comentario grande más abajo sobre por qué eso era un error). Si
        // se deja esa registración vieja viva al lado de la nueva, un
        // dispositivo que ya la tenía instalada termina con DOS service
        // workers activos para /admin (el navegador elige el de scope más
        // largo/específico según la URL exacta), lo que puede hacer que
        // una pantalla quede sirviéndose desde el worker viejo y nunca vea
        // las actualizaciones. Se borra ANTES de registrar la correcta.
        const registraciones = await navigator.serviceWorker.getRegistrations();
        for (const registracion of registraciones) {
          if (registracion.scope.endsWith("/admin/")) {
            await registracion.unregister();
          }
        }
      } catch {
        // No crítico -- si esto falla, seguimos e igual registramos la
        // versión correcta abajo.
      }

      try {
        await navigator.serviceWorker.register("/sw.js", {
          // OJO: "/admin" (SIN barra al final), no "/admin/" -- el scope
          // de un service worker se compara por prefijo de texto contra
          // la URL completa. Con "/admin/" (con barra), la URL "/admin" a
          // secas (que es justo el start_url del manifest, el
          // panel/dashboard, la PRIMERA pantalla que abre la app
          // instalada) NO empieza con "/admin/" -- le falta esa barra --
          // así que quedaba FUERA del scope y el service worker nunca la
          // interceptaba: sin conexión, el navegador iba directo a la red
          // (que fallaba) en vez de pasar por sw.js y servir la copia
          // guardada. "/admin" (sin barra) sí es prefijo tanto de
          // "/admin" como de "/admin/pedidos", "/admin/produccion", etc.
          // -- cubre todo igual, sin este hueco.
          scope: "/admin",
          // Evita que el propio navegador cachee el archivo sw.js por
          // HTTP (aparte del caché de Cache Storage que maneja el service
          // worker mismo) -- si no, un despliegue nuevo puede tardar en
          // notarse.
          updateViaCache: "none",
        });
      } catch {
        // Si falla (ej. navegador viejo, o corriendo en http sin TLS), el
        // panel sigue funcionando normal como página web -- solo no se
        // podrá "instalar" como app ni funcionar sin conexión.
      }
    })();
  }, []);

  return null;
}
