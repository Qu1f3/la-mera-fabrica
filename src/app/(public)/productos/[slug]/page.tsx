import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductoPublicoPorSlug } from "@/lib/data/catalogo";
import { prisma } from "@/lib/prisma";
import {
  ETIQUETA_TIPO,
  type EspecificacionesMoldura,
  type EspecificacionesMosaico,
} from "@/lib/types";
import { ProductGallery } from "@/components/catalogo/ProductGallery";
import { DisponibilidadBadge } from "@/components/catalogo/DisponibilidadBadge";
import { ProductCard } from "@/components/catalogo/ProductCard";
import { WhatsAppButton } from "@/components/catalogo/WhatsAppButton";
import { AgregarCotizacionButton } from "@/components/catalogo/AgregarCotizacionButton";
import { mensajeConsultaProducto } from "@/lib/whatsapp";
import { construirProductoJsonLd, jsonLdSeguro } from "@/lib/structured-data";

// La ficha de producto cambia poco (el admin la edita de vez en cuando, no
// varias veces por minuto) — se sirve cacheada hasta 5 minutos en vez de
// consultar la base de datos en cada visita, para no gastar de más en el
// plan gratuito de Supabase. Cualquier edición desde /admin/productos
// invalida esta caché al instante vía `revalidatePath`, así que nunca hay
// que esperar los 5 minutos para ver un cambio reflejado.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const producto = await getProductoPublicoPorSlug(slug);
  if (!producto) return {};

  const descripcion =
    producto.descripcion ??
    `${ETIQUETA_TIPO[producto.tipo]} ${producto.nombre} — La Mera Fábrica.`;

  return {
    title: `${producto.nombre} — La Mera Fábrica`,
    description: descripcion,
    openGraph: {
      title: producto.nombre,
      description: descripcion,
      images: producto.imagenes[0] ? [producto.imagenes[0].url] : undefined,
    },
  };
}

function especificacionesComoLista(
  tipo: "MOSAICO" | "MOLDURA",
  especificaciones: EspecificacionesMosaico | EspecificacionesMoldura | null
): { etiqueta: string; valor: string }[] {
  if (!especificaciones) return [];

  if (tipo === "MOSAICO") {
    const spec = especificaciones as EspecificacionesMosaico;
    return [
      spec.largoCm && spec.anchoCm
        ? { etiqueta: "Medidas", valor: `${spec.largoCm} x ${spec.anchoCm} cm` }
        : null,
      spec.espesorMm ? { etiqueta: "Espesor", valor: `${spec.espesorMm} mm` } : null,
      spec.coberturaCajaM2
        ? { etiqueta: "Cobertura por caja", valor: `${spec.coberturaCajaM2} m²` }
        : null,
      spec.piezasPorCaja
        ? { etiqueta: "Piezas por caja", valor: `${spec.piezasPorCaja}` }
        : null,
    ].filter((x): x is { etiqueta: string; valor: string } => x !== null);
  }

  const spec = especificaciones as EspecificacionesMoldura;
  return [
    spec.longitudPiezaCm
      ? { etiqueta: "Longitud de pieza", valor: `${spec.longitudPiezaCm} cm` }
      : null,
    spec.perfilMm ? { etiqueta: "Perfil", valor: `${spec.perfilMm} mm` } : null,
    spec.altoMm ? { etiqueta: "Alto", valor: `${spec.altoMm} mm` } : null,
  ].filter((x): x is { etiqueta: string; valor: string } => x !== null);
}

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [producto, config] = await Promise.all([
    getProductoPublicoPorSlug(slug),
    prisma.configuracion.findUnique({ where: { id: "global" } }),
  ]);

  if (!producto) notFound();

  const specs = especificacionesComoLista(producto.tipo, producto.especificaciones);
  const complementarios = producto.relacionados.filter(
    (r) => r.tipoRelacion === "COMPLEMENTARIO"
  );
  const similares = producto.relacionados.filter(
    (r) => r.tipoRelacion === "SIMILAR"
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Datos estructurados Product, sin precio (ver Fase 0 y
          src/lib/structured-data.ts) — ayuda a que el producto aparezca
          mejor descrito en resultados de búsqueda. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro(construirProductoJsonLd(producto)),
        }}
      />
      <nav className="text-sm text-piedra">
        <Link href="/" className="hover:underline">
          Catálogo
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-carbon">{producto.nombre}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery
          imagenes={producto.imagenes}
          tipo={producto.tipo}
          nombre={producto.nombre}
          patternId={`detalle-${producto.id}`}
        />

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-piedra">
            {ETIQUETA_TIPO[producto.tipo]}
            {producto.categoria ? ` · ${producto.categoria.nombre}` : ""}
          </span>
          <h1 className="mt-1 text-2xl font-semibold text-carbon sm:text-3xl">
            {producto.nombre}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <DisponibilidadBadge disponibilidad={producto.disponibilidad} />
            {producto.sku && (
              <span className="text-xs text-piedra">Código {producto.sku}</span>
            )}
          </div>

          {producto.descripcion && (
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">
              {producto.descripcion}
            </p>
          )}

          {(producto.estilo || producto.acabado || producto.colores.length > 0) && (
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {producto.estilo && (
                <div>
                  <dt className="text-piedra">
                    {producto.tipo === "MOSAICO" ? "Diseño" : "Estilo"}
                  </dt>
                  <dd className="text-carbon">{producto.estilo}</dd>
                </div>
              )}
              {producto.acabado && (
                <div>
                  <dt className="text-piedra">Acabado</dt>
                  <dd className="text-carbon">{producto.acabado}</dd>
                </div>
              )}
              {producto.colores.length > 0 && (
                <div className="col-span-2">
                  <dt className="text-piedra">Colores</dt>
                  <dd className="text-carbon">{producto.colores.join(", ")}</dd>
                </div>
              )}
              {producto.aplicaciones.length > 0 && (
                <div className="col-span-2">
                  <dt className="text-piedra">Aplicaciones recomendadas</dt>
                  <dd className="text-carbon">
                    {producto.aplicaciones.join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {specs.length > 0 && (
            <div className="mt-5 rounded-lg border border-neutral-200 p-4">
              <h2 className="text-sm font-semibold text-carbon">
                Información técnica
              </h2>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {specs.map((s) => (
                  <div key={s.etiqueta} className="contents">
                    <dt className="text-piedra">{s.etiqueta}</dt>
                    <dd className="text-carbon">{s.valor}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <AgregarCotizacionButton
              producto={{
                id: producto.id,
                nombre: producto.nombre,
                slug: producto.slug,
                tipo: producto.tipo,
                sku: producto.sku,
                imagenUrl: producto.imagenes[0]?.url ?? null,
                categoria: producto.categoria?.nombre ?? null,
                estilo: producto.estilo,
              }}
            />
            <WhatsAppButton
              numero={config?.whatsappNumero}
              mensaje={mensajeConsultaProducto(producto)}
              contexto="ficha_producto"
            />
          </div>
        </div>
      </div>

      {complementarios.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg font-semibold text-carbon">
            {producto.tipo === "MOSAICO" ? "Moldura a juego" : "Mosaico a juego"}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {complementarios.map((r) => (
              <ProductCard key={r.id} producto={r} />
            ))}
          </div>
        </section>
      )}

      {similares.length > 0 && (
        <section className="mt-16">
          <h2 className="text-lg font-semibold text-carbon">
            También te puede interesar
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similares.map((r) => (
              <ProductCard key={r.id} producto={r} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
