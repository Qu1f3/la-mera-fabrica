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
