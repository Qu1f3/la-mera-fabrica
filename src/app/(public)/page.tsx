import type { Metadata } from "next";
import {
  PRODUCTOS_POR_PAGINA,
  listCategoriasActivas,
  listOpcionesFiltro,
  listProductosPublicos,
} from "@/lib/data/catalogo";
import { listBannersActivos, listTestimoniosActivos } from "@/lib/data/contenido";
import type { TipoProducto } from "@/lib/types";
import { FilterBar } from "@/components/catalogo/FilterBar";
import { ProductCard } from "@/components/catalogo/ProductCard";
import { Paginacion } from "@/components/catalogo/Paginacion";
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

  // Página 1 por defecto (también si viene un valor inválido, ej. "abc" o
  // negativo) — ver `Paginacion.tsx`: la página 1 nunca lleva `?page=` en
  // la URL, así que este caso solo se da si alguien edita la URL a mano.
  // `listProductosPublicos` además corrige sola una página fuera de rango
  // (ej. `?page=99` con solo 2 páginas reales) devolviendo la que sí existe.
  const paginaSolicitada = Number(uno(sp.page));
  const paginaPedida =
    Number.isFinite(paginaSolicitada) && paginaSolicitada > 0
      ? Math.floor(paginaSolicitada)
      : 1;

  const [{ productos, total, pagina }, categorias, opciones, banners, testimonios] =
    await Promise.all([
      listProductosPublicos(filtros, paginaPedida),
      listCategoriasActivas(),
      listOpcionesFiltro(),
      listBannersActivos(),
      listTestimoniosActivos(),
    ]);

  const totalPaginas = Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA));

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
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
            <Paginacion
              paginaActual={pagina}
              totalPaginas={totalPaginas}
              parametros={{
                tipo: filtros.tipo,
                categoria: filtros.categoriaSlug,
                estilo: filtros.estilo,
                acabado: filtros.acabado,
                aplicacion: filtros.aplicacion,
                q: filtros.q,
              }}
            />
          </>
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
