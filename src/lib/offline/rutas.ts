/**
 * Rutas del panel que funcionan sin conexión (Fases 1-4 de
 * propuesta-modo-offline.md). El service worker (public/sw.js) cachea la
 * página completa de cada una de estas rutas cada vez que se abre con
 * señal, y las sirve desde esa copia si no hay conexión.
 *
 * RUTAS_SIN_CONEXION son coincidencias exactas; PREFIJOS_SIN_CONEXION
 * cubre rutas dinámicas (ej. el detalle de un pedido,
 * /admin/pedidos/[id]) donde no se puede listar cada URL posible de
 * antemano -- cualquier ruta que empiece con uno de estos prefijos
 * también se considera sin conexión.
 *
 * IMPORTANTE: public/sw.js es JS plano sin build (no puede importar este
 * archivo) -- tiene su PROPIA copia de estas mismas listas. Si se agrega
 * una ruta o un prefijo acá, hay que agregarlo también en public/sw.js.
 */
export const RUTAS_SIN_CONEXION = [
  "/admin",
  "/admin/produccion",
  "/admin/produccion/nuevo",
  "/admin/extras",
  "/admin/inventario",
  "/admin/pedidos",
] as const;

export const PREFIJOS_SIN_CONEXION = ["/admin/pedidos/"] as const;

export function esRutaSinConexion(pathname: string): boolean {
  if ((RUTAS_SIN_CONEXION as readonly string[]).includes(pathname)) return true;
  return (PREFIJOS_SIN_CONEXION as readonly string[]).some((prefijo) =>
    pathname.startsWith(prefijo)
  );
}
