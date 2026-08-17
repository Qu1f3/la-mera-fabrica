import Link from "next/link";

// Se muestra cuando `getProductoPublicoPorSlug` no encuentra el producto (ya
// sea porque el slug no existe o porque el producto está inactivo) — en vez
// del 404 genérico de Next.js, uno con la marca del sitio y un enlace de
// vuelta al catálogo.
export default function ProductoNoEncontrado() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        No encontramos este producto
      </h1>
      <p className="mt-2 text-sm text-piedra">
        Puede que ya no esté disponible, o que el enlace esté mal escrito.
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
