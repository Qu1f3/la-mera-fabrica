/**
 * URL pública real del sitio (sin barra al final), para metadata, sitemap,
 * robots.txt y datos estructurados que necesitan URLs absolutas.
 *
 * Se lee de NEXT_PUBLIC_SITE_URL (ver .env.example) — a propósito NO se
 * inventa un dominio: mientras no la configures, cae de vuelta a
 * http://localhost:3000 para que todo siga funcionando en desarrollo, pero
 * en producción (Vercel u otro hosting) hay que poner la URL real ahí.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "La Mera Fábrica";

export const SITE_DESCRIPTION =
  "Mosaicos y molduras para piso en Nacaome, Valle, Honduras. Catálogo con solicitud de cotización por WhatsApp.";

// Datos reales de ubicación del negocio, confirmados en la Fase 0 — no
// dependen de que el usuario los cargue en /admin/configuracion (a
// diferencia de dirección exacta, horario o redes, que sí son opcionales).
export const SITE_LOCALIDAD = "Nacaome";
export const SITE_DEPARTAMENTO = "Valle";
export const SITE_PAIS = "HN";
