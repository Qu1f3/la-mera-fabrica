import { prisma } from "@/lib/prisma";
import type {
  ProductoDetalle,
  ProductoTarjeta,
  TipoProducto,
} from "@/lib/types";

const SELECT_TARJETA = {
  id: true,
  sku: true,
  nombre: true,
  slug: true,
  tipo: true,
  estilo: true,
  acabado: true,
  disponibilidad: true,
  destacado: true,
  categoria: { select: { id: true, nombre: true, slug: true } },
  imagenes: {
    select: { id: true, url: true, alt: true, orden: true },
    orderBy: { orden: "asc" as const },
    take: 1,
  },
} as const;

export type FiltrosCatalogo = {
  tipo?: TipoProducto;
  categoriaSlug?: string;
  estilo?: string;
  acabado?: string;
  aplicacion?: string;
  q?: string;
};

export async function listCategoriasActivas() {
  return prisma.categoria.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true, slug: true },
  });
}

/**
 * Devuelve los valores de estilo/acabado/aplicación que realmente existen en
 * el catálogo activo, para construir los filtros a partir de datos reales en
 * vez de una lista fija que puede no coincidir con lo que el negocio vende.
 */
export async function listOpcionesFiltro() {
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    select: { estilo: true, acabado: true, aplicaciones: true },
  });

  const estilos = new Set<string>();
  const acabados = new Set<string>();
  const aplicaciones = new Set<string>();

  for (const p of productos) {
    if (p.estilo) estilos.add(p.estilo);
    if (p.acabado) acabados.add(p.acabado);
    for (const a of p.aplicaciones) aplicaciones.add(a);
  }

  return {
    estilos: [...estilos].sort(),
    acabados: [...acabados].sort(),
    aplicaciones: [...aplicaciones].sort(),
  };
}

export async function listProductosPublicos(
  filtros: FiltrosCatalogo
): Promise<ProductoTarjeta[]> {
  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
      ...(filtros.categoriaSlug
        ? { categoria: { slug: filtros.categoriaSlug } }
        : {}),
      ...(filtros.estilo ? { estilo: filtros.estilo } : {}),
      ...(filtros.acabado ? { acabado: filtros.acabado } : {}),
      ...(filtros.aplicacion
        ? { aplicaciones: { has: filtros.aplicacion } }
        : {}),
      ...(filtros.q
        ? {
            OR: [
              { nombre: { contains: filtros.q, mode: "insensitive" as const } },
              { sku: { contains: filtros.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: [{ destacado: "desc" }, { nombre: "asc" }],
    select: SELECT_TARJETA,
  });

  return productos as ProductoTarjeta[];
}

export async function listProductosDestacados(
  limite = 6
): Promise<ProductoTarjeta[]> {
  const productos = await prisma.producto.findMany({
    where: { activo: true, destacado: true },
    orderBy: { actualizadoEn: "desc" },
    take: limite,
    select: SELECT_TARJETA,
  });

  return productos as ProductoTarjeta[];
}

export async function getProductoPublicoPorSlug(
  slug: string
): Promise<ProductoDetalle | null> {
  const producto = await prisma.producto.findFirst({
    where: { slug, activo: true },
    select: {
      id: true,
      sku: true,
      nombre: true,
      slug: true,
      tipo: true,
      descripcion: true,
      estilo: true,
      acabado: true,
      colores: true,
      aplicaciones: true,
      disponibilidad: true,
      destacado: true,
      especificaciones: true,
      categoria: { select: { id: true, nombre: true, slug: true } },
      imagenes: {
        select: { id: true, url: true, alt: true, orden: true },
        orderBy: { orden: "asc" },
      },
      relacionadoDesde: {
        select: {
          tipoRelacion: true,
          relacionado: { select: SELECT_TARJETA },
        },
      },
    },
  });

  if (!producto) return null;

  const { relacionadoDesde, especificaciones, ...resto } = producto;

  return {
    ...resto,
    especificaciones:
      (especificaciones as ProductoDetalle["especificaciones"]) ?? null,
    relacionados: relacionadoDesde.map((r) => ({
      ...(r.relacionado as ProductoTarjeta),
      tipoRelacion: r.tipoRelacion,
    })),
  };
}
