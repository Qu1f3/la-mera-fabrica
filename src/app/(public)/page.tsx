import type { Metadata } from "next";
import {
  listCategoriasActivas,
  listOpcionesFiltro,
  listProductosPublicos,
} from "@/lib/data/catalogo";
import { listBannersActivos, listTestimoniosActivos } from "@/lib/data/contenido";
import type { TipoProducto } from "@/lib/types";
import { FilterBar } from "@/components/catalogo/FilterBar";
import { ProductCard } from "@/components/catalogo/ProductCard";
import { BannerStrip } from "@/components/contenido/BannerStrip";
import { TestimoniosSection } from "@/components/contenido/TestimoniosSection";

export const metadata: Metadata = {
  title: "La Mera Fábrica — Mosaicos y molduras para piso",
  description:
    "Mosaicos y molduras para piso en Nacaome, Valle, Honduras. Explora el catálogo por tipo, estilo, acabado y aplicación, y solicita cotización por WhatsApp.",
};

// El catálogo es la página principal del sitio (antes había una pantalla de
// inicio con hero + destacados por separado — se quitó a pedido del usuario
// para ir directo al catálogo). Banners y testimonios reales siguen
// apareciendo aquí arriba y abajo del catálogo cuando existen.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const uno = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const filtros = {
    tipo: uno(sp.tipo) as TipoProducto | undefined,
    categoriaSlug: uno(sp.categoria),
    estilo: uno(sp.estilo),
    acabado: uno(sp.acabado),
    aplicacion: uno(sp.aplicacion),
    q: uno(sp.q),
  };

  const [productos, categorias, opciones, banners, testimonios] =
    await Promise.all([
      listProductosPublicos(filtros),
      listCategoriasActivas(),
      listOpcionesFiltro(),
      listBannersActivos(),
      listTestimoniosActivos(),
    ]);

  return (
    <main>
      <BannerStrip banners={banners} />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
          Mosaicos y molduras para piso
        </h1>
        <p className="mt-1 text-sm text-piedra">
          Sin precio público — solicita cotización por WhatsApp para el
          producto que te interese.
        </p>

        <div className="mt-6">
          <FilterBar
            categorias={categorias}
            estilos={opciones.estilos}
            acabados={opciones.acabados}
            aplicaciones={opciones.aplicaciones}
            valores={{
              tipo: filtros.tipo,
              categoria: filtros.categoriaSlug,
              estilo: filtros.estilo,
              acabado: filtros.acabado,
              aplicacion: filtros.aplicacion,
              q: filtros.q,
            }}
          />
        </div>

        {productos.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center text-piedra">
            <p>No hay productos que coincidan con estos filtros todavía.</p>
          </div>
        )}
      </div>

      <TestimoniosSection testimonios={testimonios} />
    </main>
  );
}
