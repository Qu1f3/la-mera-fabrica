import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Estado de tu pedido",
  description:
    "Consulta el estado de tu pedido en Ladrillera La Mera Fábrica con el código que te enviamos por WhatsApp.",
};

export default async function EstadoPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  const codigoLimpio = (codigo ?? "").trim();
  if (codigoLimpio) {
    redirect(`/estado-pedido/${encodeURIComponent(codigoLimpio.toUpperCase())}`);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        Estado de tu pedido
      </h1>
      <p className="mt-2 text-sm text-piedra">
        Ingresa el código que te enviamos por WhatsApp para ver en qué va tu
        pedido.
      </p>

      <form method="GET" className="mt-8 flex flex-wrap gap-2">
        <input
          type="text"
          name="codigo"
          required
          placeholder="Ej: F9MEN3ZX"
          autoCapitalize="characters"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-4 py-2.5 text-sm uppercase text-carbon placeholder:normal-case focus:border-terracota focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-terracota px-5 py-2.5 text-sm font-medium text-white hover:bg-terracota-dark"
        >
          Consultar
        </button>
      </form>
    </main>
  );
}
