import { prisma } from "@/lib/prisma";
import type {
  BannerPublico,
  FaqPublica,
  SeccionContenidoPublica,
  TestimonioPublico,
} from "@/lib/types";

/**
 * Banners activos y dentro de su rango de fechas (si tienen uno). Un banner
 * sin `fechaInicio`/`fechaFin` se considera siempre vigente mientras esté
 * activo — las fechas son para promociones puntuales, no obligatorias.
 */
export async function listBannersActivos(): Promise<BannerPublico[]> {
  const ahora = new Date();

  const banners = await prisma.banner.findMany({
    where: {
      activo: true,
      OR: [{ fechaInicio: null }, { fechaInicio: { lte: ahora } }],
      AND: [{ OR: [{ fechaFin: null }, { fechaFin: { gte: ahora } }] }],
    },
    orderBy: { orden: "asc" },
    select: { id: true, titulo: true, subtitulo: true, imagenUrl: true, enlace: true },
  });

  return banners as BannerPublico[];
}

export async function listFaqsActivas(): Promise<FaqPublica[]> {
  const faqs = await prisma.faq.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    select: { id: true, pregunta: true, respuesta: true },
  });

  return faqs as FaqPublica[];
}

/**
 * Testimonios activos. A propósito no hay límite de "mínimo para mostrar" ni
 * relleno si no hay ninguno — quien llama decide no renderizar la sección
 * cuando el arreglo viene vacío (ver Fase 0: nunca testimonios de relleno).
 */
export async function listTestimoniosActivos(): Promise<TestimonioPublico[]> {
  const testimonios = await prisma.testimonio.findMany({
    where: { activo: true },
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      nombreCliente: true,
      texto: true,
      calificacion: true,
      fotoUrl: true,
    },
  });

  return testimonios as TestimonioPublico[];
}

/**
 * La sección "Nosotros" es una sola fila identificada por `clave`. Si
 * todavía no existe (el admin no la ha llenado), devuelve null — la página
 * pública se encarga de mostrar un placeholder honesto en vez de texto
 * inventado (ver Fase 0).
 */
export async function getSeccionNosotros(): Promise<SeccionContenidoPublica> {
  const seccion = await prisma.seccionContenido.findUnique({
    where: { clave: "nosotros" },
    select: { titulo: true, cuerpo: true, imagenUrl: true },
  });

  return seccion ?? null;
}
