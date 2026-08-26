import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { EstadoBadge } from "@/components/admin/ui/EstadoBadge";
import { formatearFechaHonduras } from "@/lib/fecha";
import {
  COLOR_ESTADO_PEDIDO,
  ETIQUETA_ESTADO_PEDIDO,
  type EstadoPedido,
} from "@/lib/types";
import { EditarClienteForm } from "./EditarClienteForm";
import { eliminarCliente } from "../actions";

export const metadata = { title: "Ficha de cliente — Panel administrativo" };

export default async function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      pedidos: {
        orderBy: { creadoEn: "desc" },
        select: {
          id: true,
          codigo: true,
          estado: true,
          montoTotal: true,
          creadoEn: true,
        },
      },
    },
  });

  if (!cliente) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/clientes"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Clientes
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {cliente.nombre}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Cliente desde el {formatearFechaHonduras(cliente.creadoEn)} —{" "}
            {cliente.pedidos.length}{" "}
            {cliente.pedidos.length === 1 ? "pedido" : "pedidos"}
          </p>
        </div>
        <Link
          href={`/admin/pedidos/nuevo?clienteId=${cliente.id}`}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Nuevo pedido
        </Link>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Datos</h2>
        <EditarClienteForm
          clienteId={cliente.id}
          nombre={cliente.nombre}
          telefono={cliente.telefono}
          notas={cliente.notas ?? ""}
        />
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Historial de pedidos
        </h2>
        {cliente.pedidos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            Todavía no tiene pedidos.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-neutral-100">
            {cliente.pedidos.map((pedido) => (
              <li key={pedido.id} className="py-2.5">
                <Link
                  href={`/admin/pedidos/${pedido.id}`}
                  className="flex items-center justify-between gap-3 text-sm hover:opacity-80"
                >
                  <span className="font-medium text-neutral-900">
                    #{pedido.codigo}
                  </span>
                  <span className="text-neutral-500">
                    {formatearFechaHonduras(pedido.creadoEn)}
                  </span>
                  <span className="text-neutral-700">
                    L. {pedido.montoTotal.toString()}
                  </span>
                  <EstadoBadge
                    label={ETIQUETA_ESTADO_PEDIDO[pedido.estado as EstadoPedido]}
                    colorClasses={COLOR_ESTADO_PEDIDO[pedido.estado as EstadoPedido]}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        {cliente.pedidos.length > 0 ? (
          <p className="mt-1 text-sm text-neutral-600">
            No se puede borrar: este cliente tiene {cliente.pedidos.length}{" "}
            pedido(s) registrado(s). El historial de pedidos siempre se
            conserva.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-neutral-600">
              Borrar este cliente no se puede deshacer.
            </p>
            <form action={eliminarCliente.bind(null, cliente.id)} className="mt-3">
              <ConfirmSubmitButton
                confirmMessage={`¿Borrar a "${cliente.nombre}" para siempre? Esto no se puede deshacer.`}
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Borrar cliente
              </ConfirmSubmitButton>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
