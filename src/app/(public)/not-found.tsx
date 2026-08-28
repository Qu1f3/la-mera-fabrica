import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Página no encontrada" };

// 404 genérico para CUALQUIER URL del sitio público que no exista (no solo
// producto/pedido, que ya tienen su propio not-found.tsx específico). Vive
// dentro de "(public)" para renderizarse DENTRO de ese layout (header, nav,
// footer) en vez del 404 genérico de Next.js sin marca.
//
// Detalle importante de Next.js: un not-found.tsx dentro de un route group
// SOLO se dispara para rutas que ya "entraron" a ese grupo (llamando
// notFound() a mano, o un segmento dinámico que no matcheó). Una URL
// totalmente inventada (ej. /algo-que-no-existe) no matchea ningún archivo
// dentro de "(public)" por sí sola, así que sin ayuda caería en el 404
// genérico de Next.js. Por eso existe también
// `(public)/[...catchall]/page.tsx`: un catch-all que sí matchea cualquier
// URL no definida y llama a `notFound()`, lo que activa ESTE archivo con el
// layout público completo alrededor.
export default function NoEncontradoPublico() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        No encontramos esta página
      </h1>
      <p className="mt-2 text-sm text-piedra">
        Puede que el enlace esté mal escrito o que la página ya no exista.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-terracota px-5 py-2.5 text-sm font-medium text-white hover:bg-terracota-dark"
      >
        Ver catálogo
      </Link>
    </main>
  );
}
