// Service worker del Panel administrativo de La Mera Fábrica.
//
// A partir de la Fase 1 de "modo sin conexión" (ver
// propuesta-modo-offline.md en la raíz del repo) esto SÍ cachea, a
// diferencia de la versión anterior de este archivo (que a propósito no
// cacheaba nada). Dos cosas nada más, deliberadamente:
//
//  1. El cascarón estático de la app (JS/CSS con hash en el nombre,
//     íconos, manifest) -- cache-first: Next.js le pone un hash al nombre
//     de archivo, así que una URL exacta cacheada nunca cambia por debajo.
//  2. La página completa (HTML con los datos ya renderizados adentro) de
//     una lista explícita de rutas que se diseñaron para funcionar sin
//     conexión (RUTAS_SIN_CONEXION abajo) -- red primero, y si falla (sin
//     señal), se sirve la última copia guardada la última vez que sí hubo
//     señal.
//
// Cualquier OTRA página del panel (Reportes, Finanzas, Clientes, etc.) NO
// se cachea a propósito, igual que antes -- mostrar un reporte financiero
// o un stock viejo como si fuera el de ahora es peor que no mostrar nada.
// Si una fase futura agrega una pantalla nueva al modo sin conexión,
// agregarla acá.
//
// IMPORTANTE: estas listas deben coincidir con RUTAS_SIN_CONEXION y
// PREFIJOS_SIN_CONEXION en src/lib/offline/rutas.ts -- este archivo es JS
// plano sin build (no pasa por Next.js/TypeScript), así que no puede
// importar esas constantes; hay que mantener las copias sincronizadas a
// mano.
const RUTAS_SIN_CONEXION = [
  "/admin",
  "/admin/produccion",
  "/admin/produccion/nuevo",
  "/admin/extras",
  "/admin/inventario",
  "/admin/pedidos",
];
// Cubre rutas dinámicas como el detalle de un pedido (/admin/pedidos/[id])
// y /admin/pedidos/nuevo -- cualquier URL que empiece con uno de estos
// prefijos también se sirve desde caché si no hay conexión.
const PREFIJOS_SIN_CONEXION = ["/admin/pedidos/"];

const VERSION_CACHE = "lmf-v1";
const CACHE_ESTATICO = `${VERSION_CACHE}-estatico`;
const CACHE_PAGINAS = `${VERSION_CACHE}-paginas`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((nombre) => nombre.startsWith("lmf-") && !nombre.startsWith(VERSION_CACHE))
          .map((nombre) => caches.delete(nombre))
      );
      await self.clients.claim();
    })()
  );
});

function esRutaSinConexion(url) {
  if (RUTAS_SIN_CONEXION.includes(url.pathname)) return true;
  return PREFIJOS_SIN_CONEXION.some((prefijo) => url.pathname.startsWith(prefijo));
}

function esEstaticoDeNext(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.json" ||
    /^\/icon-.*\.png$/.test(url.pathname) ||
    /^\/logo.*\.png$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // Las escrituras (POST) nunca se cachean.

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1) Cascarón estático: cache-first (nunca cambia de contenido bajo la
  //    misma URL con hash).
  if (esEstaticoDeNext(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_ESTATICO);
        const enCache = await cache.match(request);
        if (enCache) return enCache;
        const respuesta = await fetch(request);
        if (respuesta.ok) cache.put(request, respuesta.clone());
        return respuesta;
      })()
    );
    return;
  }

  // 2) Páginas explícitamente habilitadas para sin-conexión: red primero
  //    (para tener siempre lo más fresco posible cuando SÍ hay señal),
  //    caché como respaldo si la red falla. Solo aplica a una navegación
  //    de verdad (recarga completa / se abrió el ícono de la app), no a
  //    las transiciones internas de Next.js entre páginas -- por eso en
  //    la app, los enlaces hacia/entre estas rutas son <a> normales y no
  //    <Link>, para forzar ese tipo de navegación (ver AdminNav.tsx y
  //    propuesta-modo-offline.md).
  if (request.mode === "navigate" && esRutaSinConexion(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_PAGINAS);
        try {
          const respuesta = await fetch(request);
          if (respuesta.ok) cache.put(request, respuesta.clone());
          return respuesta;
        } catch {
          const enCache = await cache.match(request);
          if (enCache) return enCache;
          throw new Error("Sin conexión y todavía no hay una copia guardada de esta página.");
        }
      })()
    );
    return;
  }

  // 3) Todo lo demás (datos, /api/*, imágenes de producto, cualquier otra
  //    página): directo a la red, sin caché -- igual que antes.
});
