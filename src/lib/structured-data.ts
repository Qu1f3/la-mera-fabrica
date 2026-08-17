import {
  SITE_DEPARTAMENTO,
  SITE_DESCRIPTION,
  SITE_LOCALIDAD,
  SITE_NAME,
  SITE_PAIS,
  SITE_URL,
} from "@/lib/site";
import type { ProductoDetalle } from "@/lib/types";
import { ETIQUETA_TIPO } from "@/lib/types";

/**
 * Datos estructurados (schema.org) para que buscadores como Google entiendan
 * mejor el sitio. Reglas que se repiten en los tres helpers de este archivo:
 *
 * - Nunca se inventa un dato: cada campo opcional solo aparece si hay un
 *   valor real cargado (en Configuracion, en el producto, etc.).
 * - Los productos NUNCA llevan "offers"/precio (ver Fase 0: sin precio
 *   público) — Product aquí es solo información descriptiva.
 * - El horario de atención (Configuracion.horarioAtencion) es texto libre
 *   ("Lunes a sábado, 8am a 5pm") y a propósito no se traduce a
 *   `openingHoursSpecification`: forzar ese texto a un formato estructurado
 *   sin que el usuario lo confirme campo por campo arriesgaría publicar un
 *   horario incorrecto, que es peor que no publicarlo.
 */

/**
 * Convierte un objeto de datos estructurados a JSON listo para inyectar en
 * un `<script type="application/ld+json">` vía `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` por sí solo NO escapa el carácter "menor que" — si algún
 * campo (nombre de producto, pregunta de FAQ, dirección del negocio, etc.)
 * llegara a contener literalmente el cierre de una etiqueta script, rompería
 * fuera del bloque JSON-LD e insertaría HTML/script ejecutable en la página
 * (XSS). Reemplazarlo por su escape Unicode es la mitigación estándar para
 * este patrón y no cambia el JSON en sí — cualquier parser de JSON-LD lo
 * interpreta igual.
 */
export function jsonLdSeguro(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}

export function construirLocalBusiness(config: {
  direccion?: string | null;
  whatsappNumero?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
} | null) {
  const sameAs = [config?.facebookUrl, config?.instagramUrl].filter(
    (url): url is string => Boolean(url)
  );

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      ...(config?.direccion ? { streetAddress: config.direccion } : {}),
      addressLocality: SITE_LOCALIDAD,
      addressRegion: SITE_DEPARTAMENTO,
      addressCountry: SITE_PAIS,
    },
    ...(config?.whatsappNumero
      ? { telephone: `+${config.whatsappNumero.replace(/\D/g, "")}` }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function construirProductoJsonLd(producto: ProductoDetalle) {
  const imagenes = producto.imagenes.map((img) => img.url);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description:
      producto.descripcion ??
      `${ETIQUETA_TIPO[producto.tipo]} ${producto.nombre} — ${SITE_NAME}.`,
    ...(producto.sku ? { sku: producto.sku } : {}),
    ...(imagenes.length > 0 ? { image: imagenes } : {}),
    category: producto.categoria
      ? producto.categoria.nombre
      : ETIQUETA_TIPO[producto.tipo],
    brand: { "@type": "Brand", name: SITE_NAME },
    // Sin "offers": el sitio no publica precio (ver Fase 0).
  };
}

export function construirFaqJsonLd(
  faqs: { pregunta: string; respuesta: string }[]
) {
  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.pregunta,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.respuesta,
      },
    })),
  };
}
