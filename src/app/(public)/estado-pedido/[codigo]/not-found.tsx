import Link from "next/link";

// Se muestra cuando el código de pedido no existe en la base de datos --
// mismo patrón que src/app/(public)/productos/[slug]/not-found.tsx.
export default function PedidoNoEncontrado() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        No encontramos ese pedido
      </h1>
      <p className="mt-2 text-sm text-piedra">
        Revisa que el código esté bien escrito. Es el mismo que te enviamos
        por WhatsApp al confirmar tu pedido.
      </p>
      <Link
        href="/estado-pedido"
        className="mt-6 inline-block rounded-md bg-terracota px-5 py-2.5 text-sm font-medium text-white hover:bg-terracota-dark"
      >
        Intentar de nuevo
      </Link>
    </main>
  );
}
