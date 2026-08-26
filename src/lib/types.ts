// Tipos compartidos entre el panel y el sitio público. Se definen a mano (en
// vez de importarlos generados por Prisma) para que los componentes de UI no
// dependan de que el cliente de Prisma ya esté generado — y porque son, en
// esencia, los mismos enums de prisma/schema.prisma expresados como literales.

export type TipoProducto = "MOSAICO" | "MOLDURA";

export type Disponibilidad =
  | "DISPONIBLE"
  | "BAJO_PEDIDO"
  | "AGOTADO"
  | "DESCONTINUADO";

export type TipoRelacion = "COMPLEMENTARIO" | "SIMILAR";

export type EstadoCotizacion = "NUEVA" | "CONTACTADO" | "CERRADA";

export type UnidadCotizacion = "M2" | "ML";

export type CategoriaResumen = {
  id: string;
  nombre: string;
  slug: string;
};

export type ImagenResumen = {
  id: string;
  url: string;
  alt: string | null;
  orden: number;
};

/** Especificaciones técnicas en el JSON de Producto.especificaciones. */
export type EspecificacionesMosaico = {
  largoCm?: number;
  anchoCm?: number;
  espesorMm?: number;
  coberturaCajaM2?: number;
  piezasPorCaja?: number;
};

export type EspecificacionesMoldura = {
  longitudPiezaCm?: number;
  perfilMm?: number;
  altoMm?: number;
};

export type ProductoTarjeta = {
  id: string;
  sku: string | null;
  nombre: string;
  slug: string;
  tipo: TipoProducto;
  estilo: string | null;
  acabado: string | null;
  disponibilidad: Disponibilidad;
  destacado: boolean;
  categoria: CategoriaResumen | null;
  imagenes: ImagenResumen[];
};

export type ProductoRelacionadoResumen = ProductoTarjeta & {
  tipoRelacion: TipoRelacion;
};

export type ProductoDetalle = ProductoTarjeta & {
  descripcion: string | null;
  colores: string[];
  aplicaciones: string[];
  especificaciones: EspecificacionesMosaico | EspecificacionesMoldura | null;
  relacionados: ProductoRelacionadoResumen[];
};

export const ETIQUETA_TIPO: Record<TipoProducto, string> = {
  MOSAICO: "Mosaico",
  MOLDURA: "Moldura",
};

export const ETIQUETA_DISPONIBILIDAD: Record<Disponibilidad, string> = {
  DISPONIBLE: "Disponible",
  BAJO_PEDIDO: "Bajo pedido",
  AGOTADO: "Agotado",
  DESCONTINUADO: "Descontinuado",
};

// La unidad de cotización no la elige el cliente: se deriva del tipo de
// producto (mosaico se cotiza por m², moldura por metro lineal — ver
// prisma/schema.prisma, UnidadCotizacion).
export const UNIDAD_POR_TIPO: Record<TipoProducto, UnidadCotizacion> = {
  MOSAICO: "M2",
  MOLDURA: "ML",
};

export const ETIQUETA_UNIDAD: Record<UnidadCotizacion, string> = {
  M2: "m²",
  ML: "ml",
};

export const ETIQUETA_ESTADO_COTIZACION: Record<EstadoCotizacion, string> = {
  NUEVA: "Nueva",
  CONTACTADO: "Contactado",
  CERRADA: "Cerrada",
};

/**
 * Un producto dentro del carrito de cotización, guardado en localStorage.
 * `cantidad` es opcional a propósito: un cliente puede no saber todavía
 * cuántos m²/ml necesita y aun así querer pedir cotización de un producto —
 * `null` significa "cantidad por confirmar", no cero.
 */
export type ItemCarrito = {
  productoId: string;
  nombre: string;
  slug: string;
  tipo: TipoProducto;
  sku: string | null;
  imagenUrl: string | null;
  unidad: UnidadCotizacion;
  cantidad: number | null;
  // Categoría ("Acera"/"Liso") y diseño (Maya, Granito, Espiral, Estrella,
  // Palmera — ver src/lib/disenoMosaico.ts) del producto al momento de
  // agregarlo al carrito. Solo aplican a mosaico; para moldura quedan null.
  // Se llevan hasta el mensaje de WhatsApp para que la cotización llegue con
  // más detalle, sin que el negocio tenga que volver a buscar el producto.
  categoria: string | null;
  diseno: string | null;
};

// ---------------------------------------------------------------------------
// Contenido editable del sitio (Fase 4)
// ---------------------------------------------------------------------------

export type BannerPublico = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagenUrl: string | null;
  enlace: string | null;
};

export type FaqPublica = {
  id: string;
  pregunta: string;
  respuesta: string;
};

export type TestimonioPublico = {
  id: string;
  nombreCliente: string;
  texto: string;
  calificacion: number | null;
  fotoUrl: string | null;
};

export type SeccionContenidoPublica = {
  titulo: string;
  cuerpo: string | null;
  imagenUrl: string | null;
} | null;

// ---------------------------------------------------------------------------
// Sistema de gestión: pedidos (panel interno, distinto de la cotización
// pública de arriba)
// ---------------------------------------------------------------------------

export type EstadoPedido =
  | "PEDIDO_RECIBIDO"
  | "EN_PRODUCCION"
  | "EN_SECADO"
  | "EN_RIEGO"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

export type EstadoEntrega =
  | "PENDIENTE"
  | "LISTO"
  | "EN_ENTREGA"
  | "ENTREGADO"
  | "CANCELADO";

// Orden real del ciclo de vida de un pedido (para la cola, el stepper del
// tracker público más adelante, y cualquier lugar que necesite "¿qué tan
// avanzado va esto?"). CANCELADO queda fuera a propósito: no es un paso del
// camino normal, es una salida.
export const ORDEN_ESTADO_PEDIDO: EstadoPedido[] = [
  "PEDIDO_RECIBIDO",
  "EN_PRODUCCION",
  "EN_SECADO",
  "EN_RIEGO",
  "LISTO",
  "ENTREGADO",
];

export const ETIQUETA_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  PEDIDO_RECIBIDO: "Pedido recibido",
  EN_PRODUCCION: "En producción",
  EN_SECADO: "En secado",
  EN_RIEGO: "En riego",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const ETIQUETA_ESTADO_ENTREGA: Record<EstadoEntrega, string> = {
  PENDIENTE: "Pendiente",
  LISTO: "Listo",
  EN_ENTREGA: "En entrega",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

/**
 * Color de cada estado para el Badge del panel (ver
 * src/components/admin/ui/EstadoBadge.tsx) — clases de Tailwind ya
 * combinadas en fondo/texto/borde suaves, mismo patrón que ya usa el panel
 * para su "zona de riesgo" (bg-*-50 text-*-700 border-*-200).
 */
export const COLOR_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  PEDIDO_RECIBIDO: "bg-neutral-100 text-neutral-700 border-neutral-300",
  EN_PRODUCCION: "bg-amber-50 text-amber-700 border-amber-200",
  EN_SECADO: "bg-orange-50 text-orange-700 border-orange-200",
  EN_RIEGO: "bg-cyan-50 text-cyan-700 border-cyan-200",
  LISTO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ENTREGADO: "bg-green-100 text-green-800 border-green-300",
  CANCELADO: "bg-red-50 text-red-700 border-red-200",
};

export const COLOR_ESTADO_ENTREGA: Record<EstadoEntrega, string> = {
  PENDIENTE: "bg-neutral-100 text-neutral-700 border-neutral-300",
  LISTO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EN_ENTREGA: "bg-purple-50 text-purple-700 border-purple-200",
  ENTREGADO: "bg-green-100 text-green-800 border-green-300",
  CANCELADO: "bg-red-50 text-red-700 border-red-200",
};

// Mensajes amigables para el tracker público (Fase 4) y para notas
// automáticas del historial — se centralizan aquí para no repetir el texto
// en varios lugares.
export const MENSAJE_ESTADO_PEDIDO: Partial<Record<EstadoPedido, string>> = {
  EN_PRODUCCION:
    "🏭 Estamos fabricando tu pedido. Nuestro equipo está trabajando en él.",
  EN_SECADO: "☀️ Tu pedido se encuentra en proceso de secado.",
  EN_RIEGO:
    "💧 Tu pedido está recibiendo el tratamiento necesario antes de ser entregado.",
  LISTO: "🎉 ¡Tu pedido está listo!",
  ENTREGADO:
    "📦 Tu pedido ha sido entregado. ¡Gracias por confiar en La Mera Fábrica!",
};

export type ClienteResumen = {
  id: string;
  nombre: string;
  telefono: string;
};

/** Un ítem dentro del formulario de creación/edición de un pedido. */
export type ItemPedidoFormulario = {
  productoId: string;
  nombre: string;
  categoria: string | null;
  diseno: string | null;
  color: string | null;
  cantidad: number;
  precioUnitario: number;
};
