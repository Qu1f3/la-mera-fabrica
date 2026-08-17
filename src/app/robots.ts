import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // El panel administrativo ya está protegido por sesión (Fase 1), pero
      // igual se marca fuera del índice. "/cotizacion" es el carrito
      // personal del visitante (contenido transitorio, sin valor de
      // búsqueda) — se deja fuera para no indexar páginas vacías o
      // duplicadas.
      disallow: ["/admin", "/cotizacion"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
