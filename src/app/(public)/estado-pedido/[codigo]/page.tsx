import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatearFechaHonduras } from "@/lib/fecha";
import {
  ETIQUETA_ESTADO_PEDIDO,
  MENSAJE_ESTADO_PEDIDO,
  ORDEN_ESTADO_PEDIDO,
  type EstadoPedido,
} from "@/lib/types";

// Nunca cacheado -- el estado del pedido cambia en cualquier momento y el
// cliente tiene que ver siempre el dato real, no una versión vieja.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  return {
    title: `Pedido ${codigo.toUpperCase()}`,
    // No indexar: son páginas privadas por código, no contenido para buscar.
    robots: { index: false, follow: false },
  };
}

export default async function DetalleEstadoPedidoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { codigo: codigo.toUpperCase() },
    include: {
      items: { include: { producto: true } },
      entregas: { orderBy: { creadoEn: "asc" } },
    },
  });

  if (!pedido) notFound();

  const cancelado = pedido.estado === "CANCELADO";
  const indiceActual = ORDEN_ESTADO_PEDIDO.indexOf(pedido.estado as EstadoPedido);
  const mensaje = MENSAJE_ESTADO_PEDIDO[pedido.estado as EstadoPedido];

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <p className="text-sm text-piedra">Pedido</p>
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        {pedido.codigo}
      </h1>

      {cancelado ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Este pedido fue cancelado. Si tienes dudas, escríbenos por WhatsApp.
        </div>
      ) : (
        <>
          <ol className="mt-8 space-y-0">
            {ORDEN_ESTADO_PEDIDO.map((estado, indice) => {
              const alcanzado = indiceActual >= indice;
              const esActual = indiceActual === indice;
              return (
                <li key={estado} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                        alcanzado
                          ? "border-terracota bg-terracota text-white"
                          : "border-neutral-300 bg-white text-neutral-400"
                      }`}
                    >
                      {alcanzado ? "✓" : ""}
                    </span>
                    {indice < ORDEN_ESTADO_PEDIDO.length - 1 && (
                      <span
                        className={`h-8 w-0.5 ${
                          indiceActual > indice ? "bg-terracota" : "bg-neutral-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-8 ${esActual ? "" : "opacity-70"}`}>
                    <p
                      className={`text-sm font-medium ${
                        esActual ? "text-carbon" : "text-piedra"
                      }`}
                    >
                      {ETIQUETA_ESTADO_PEDIDO[estado]}
                    </p>
                    {esActual && mensaje && (
                      <p className="mt-1 text-sm text-piedra">{mensaje}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <dl className="mt-2 grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-arena p-4 text-sm sm:grid-cols-2">
        {pedido.fechaPrometida && (
          <div>
            <dt className="text-piedra">Fecha prometida</dt>
            <dd className="font-medium text-carbon">
              {formatearFechaHonduras(pedido.fechaPrometida)}
            </dd>
          </div>
        )}
        {pedido.fechaEntregaReal && (
          <div>
            <dt className="text-piedra">Entregado el</dt>
            <dd className="font-medium text-carbon">
              {formatearFechaHonduras(pedido.fechaEntregaReal)}
            </dd>
          </div>
        )}
      </dl>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-carbon">Productos</h2>
        <ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {pedido.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div>
                <p className="font-medium text-carbon">{item.producto.nombre}</p>
                <p className="text-piedra">
                  {[item.categoria, item.diseno, item.color ? `Color: ${item.color}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <p className="whitespace-nowrap text-piedra">
                {item.cantidad.toString()} unidades
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-center text-sm text-piedra">
        ¿Tienes dudas sobre tu pedido?{" "}
        <Link href="/contacto" className="text-terracota hover:underline">
          Contáctanos
        </Link>
      </p>
    </main>
  );
}
