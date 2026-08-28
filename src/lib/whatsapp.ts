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

// ---------------------------------------------------------------------------
// Sistema de gestión: mensajes de pedido -- plantillas configurables
// ---------------------------------------------------------------------------
// Fase 9: estos mensajes ya NO están fijos en el código -- se guardan en la
// tabla PlantillaMensaje y se pueden editar desde /admin/configuracion
// (pestaña "Plantillas de WhatsApp"). Este archivo solo guarda el texto por
// DEFECTO (para la primera vez que se necesita una plantilla y todavía no
// existe en la base de datos -- ver configuracion/page.tsx) y la función
// que sustituye las variables `{{clave}}` por el dato real de cada pedido.
// El mensaje siempre se puede editar a mano justo antes de enviarlo
// (EnviarWhatsAppModal.tsx), esto solo cambia CUÁL es el texto de partida.

export const CLAVE_PLANTILLA_CONFIRMACION_PEDIDO = "confirmacion_pedido";
export const CLAVE_PLANTILLA_PEDIDO_LISTO = "pedido_listo";

export const PLANTILLAS_WHATSAPP_DEFECTO: {
  clave: string;
  nombre: string;
  cuerpo: string;
}[] = [
  {
    clave: CLAVE_PLANTILLA_CONFIRMACION_PEDIDO,
    nombre: "Confirmación de pedido",
    cuerpo: `Hola, {{nombreCliente}}. \u{1F9F1}\n\nHemos recibido correctamente su pedido en Ladrillera La Mera Fábrica.\n\nSu código de pedido es:\n{{codigo}}\n\nPuedes consultar el estado de tu pedido aquí:\n{{linkTracker}}\n\nGracias por confiar en nosotros. \u{1F3ED}`,
  },
  {
    clave: CLAVE_PLANTILLA_PEDIDO_LISTO,
    nombre: "Pedido listo",
    cuerpo: `Hola, {{nombreCliente}}. \u{1F9F1}\n\nLe informamos que su pedido {{codigo}} ya está listo.\n\nPuede pasar a recogerlo a partir del {{fecha}}.\n\nGracias por su preferencia.\nLadrillera La Mera Fábrica.`,
  },
];

// Qué variables acepta cada plantilla -- se muestra como ayuda debajo del
// campo de edición para que el admin no invente un nombre que no existe.
export const VARIABLES_PLANTILLA: Record<string, string[]> = {
  [CLAVE_PLANTILLA_CONFIRMACION_PEDIDO]: ["nombreCliente", "codigo", "linkTracker"],
  [CLAVE_PLANTILLA_PEDIDO_LISTO]: ["nombreCliente", "codigo", "fecha"],
};

/**
 * Sustituye `{{variable}}` por su valor real. Si una variable no viene en
 * `valores` (ej: el admin escribió mal el nombre), se deja el `{{...}}`
 * literal en el mensaje en vez de borrarlo en silencio -- así el error se
 * nota de inmediato al leer el mensaje antes de enviarlo.
 */
export function renderPlantilla(cuerpo: string, valores: Record<string, string>): string {
  return cuerpo.replace(/\{\{(\w+)\}\}/g, (coincidencia, clave: string) =>
    Object.prototype.hasOwnProperty.call(valores, clave) ? valores[clave] : coincidencia
  );
}
