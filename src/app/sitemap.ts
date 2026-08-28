import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

// Genera sitemap.xml dinámicamente a partir del catálogo real — no hace
// falta mantenerlo a mano cada vez que se agrega o quita un producto.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    select: { slug: true, actualizadoEn: true },
  });

  const paginasEstaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE_URL}/nosotros`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/preguntas-frecuentes`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/contacto`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/politica-de-privacidad`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terminos-y-condiciones`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const paginasProducto: MetadataRoute.Sitemap = productos.map((p: { slug: string; actualizadoEn: Date }) => ({
    url: `${SITE_URL}/productos/${p.slug}`,
    lastModified: p.actualizadoEn,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...paginasEstaticas, ...paginasProducto];
}
