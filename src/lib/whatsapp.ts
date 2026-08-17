import { ETIQUETA_UNIDAD, type UnidadCotizacion } from "@/lib/types";

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
  }[];
}): string {
  const lista = datos.items
    .map((item) =>
      item.cantidad != null
        ? `- ${item.nombre}: ${item.cantidad} ${ETIQUETA_UNIDAD[item.unidad]}`
        : `- ${item.nombre}: cantidad por confirmar`
    )
    .join("\n");

  return `Hola, soy ${datos.nombreCliente}. Quisiera una cotización de:\n${lista}\n\nVi los productos en el sitio de La Mera Fábrica.`;
}
