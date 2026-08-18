import { ETIQUETA_UNIDAD, type UnidadCotizacion } from "@/lib/types";
import { piezasDeMosaico } from "@/lib/cobertura";

/**
 * Arma un enlace wa.me con el mensaje ya escrito, para que el cliente no
 * tenga que redactar nada a mano (ver Fase 0, sección "WhatsApp").
 *
 * `numero` debe venir de Configuracion.whatsappNumero (con código de país,
 * solo dígitos, ej: "50499999999"). Si no está configurado todavía,
 * devuelve null — quien llama decide cómo tratarlo (normalmente: ocultar el
 * botón en vez de mostrar un enlace roto).
 */
export function buildWhatsAppUrl(
  numero: string | null | undefined,
  mensaje: string
): string | null {
  if (!numero) return null;

  const soloDigitos = numero.replace(/\D/g, "");
  if (!soloDigitos) return null;

  return `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`;
}

/** Mensaje pre-armado para consultar un producto individual. */
export function mensajeConsultaProducto(producto: {
  nombre: string;
  sku?: string | null;
}): string {
  return `Hola, quisiera más información sobre ${producto.nombre}. Vi el producto en el sitio de La Mera Fábrica.`;
}

/**
 * Mensaje pre-armado para la solicitud de cotización completa (Fase 3, el
 * "checkout" del sitio — ver Fase 0, decisión 2). Se arma después de guardar
 * la SolicitudCotizacion en la base de datos, así que aquí solo se recibe lo
 * necesario para el texto, no el registro completo.
 */
export function mensajeSolicitudCotizacion(datos: {
  nombreCliente: string;
  items: {
    nombre: string;
    cantidad: number | null;
    unidad: UnidadCotizacion;
    sku: string | null;
    categoria: string | null;
    diseno: string | null;
  }[];
}): string {
  const lista = datos.items
    .map((item) => {
      // Código, categoría y diseño (ver src/lib/disenoMosaico.ts) entre
      // paréntesis después del nombre, para que la cotización llegue con más
      // detalle del producto y el negocio no tenga que ir a buscarlo — solo
      // aparecen si el producto los tiene (no todos tienen código cargado, y
      // moldura no tiene diseño).
      const detalle = [
        item.sku ? `Código: ${item.sku}` : null,
        item.categoria ? `Categoría: ${item.categoria}` : null,
        item.diseno ? `Diseño: ${item.diseno}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      const nombreConDetalle = detalle ? `${item.nombre} (${detalle})` : item.nombre;

      if (item.cantidad == null) {
        return `- ${nombreConDetalle}: cantidad por confirmar`;
      }

      const base = `- ${nombreConDetalle}: ${item.cantidad} ${ETIQUETA_UNIDAD[item.unidad]}`;
      // La cantidad de mosaico se guarda en m² — se agrega la conversión a
      // piezas (ver src/lib/cobertura.ts) para que la cotización llegue
      // lista para despachar, sin que el negocio tenga que volver a
      // calcularlo del lado de acá.
      if (item.unidad !== "M2") return base;
      return `${base} (≈ ${piezasDeMosaico(item.cantidad)} piezas)`;
    })
    .join("\n");

  return `Hola, soy ${datos.nombreCliente}. Quisiera una cotización de:\n${lista}\n\nVi los productos en el sitio de La Mera Fábrica.`;
}
