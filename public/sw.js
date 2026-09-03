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

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Precarga proactiva de las páginas sin conexión que se conocen de
  // antemano (todas menos el detalle de un pedido, que es dinámico y no
  // se puede listar de antemano -- esas se siguen cacheando solo cuando
  // se visitan de verdad, como hasta ahora).
  //
  // Sin esto, la PRIMERA vez que este service worker se instala en un
  // dispositivo, la página que dispara la instalación (la que el usuario
  // tiene abierta en ese momento) NO queda cacheada por esa visita -- un
  // service worker recién instalado no controla la navegación que ya
  // estaba en curso cuando se registró, solo las siguientes. Eso
  // significaba que había que visitar cada pantalla DOS VECES con señal
  // (una para que se registre/active el service worker, otra para que
  // recién ahí quede guardada la copia) antes de que sin conexión
  // funcionara -- fácil de no notar y que requiere de bastante explicación.
  // Con esta precarga, una sola visita con señal alcanza.
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_PAGINAS);
      const rutasAPrecachear = [...RUTAS_SIN_CONEXION, "/admin/pedidos/nuevo"];
      await Promise.all(
        rutasAPrecachear.map(async (ruta) => {
          try {
            const respuesta = await fetch(ruta, { credentials: "same-origin" });
            // Si en este momento no hay sesión iniciada, la ruta redirige a
            // /admin/login y ESO es lo que quedaría precargado bajo esta
            // URL -- no es grave, la próxima visita real con sesión activa
            // lo reemplaza (ver la rama de "navigate" del fetch handler,
            // más abajo, que siempre vuelve a guardar la copia más
            // reciente cuando hay señal).
            if (respuesta.ok) await cache.put(ruta, respuesta);
          } catch {
            // Sin señal justo en el momento de instalar el service worker
            // (raro, pero posible) -- no es grave, se cachea igual la
            // próxima vez que se visite esa pantalla con conexión.
          }
        })
      );
    })()
  );
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
