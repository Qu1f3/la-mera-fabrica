import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EstadoBadge } from "@/components/admin/ui/EstadoBadge";
import { formatearFechaHoraHonduras, formatearFechaHonduras } from "@/lib/fecha";
import {
  COLOR_ESTADO_PEDIDO,
  ETIQUETA_ESTADO_PEDIDO,
  type EstadoPedido,
} from "@/lib/types";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Pedidos — Panel administrativo" };

const ESTADOS_FILTRO: EstadoPedido[] = Object.keys(
  ETIQUETA_ESTADO_PEDIDO
) as EstadoPedido[];

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const busqueda = (q || "").trim();
  const estadoFiltro = (estado || "") as EstadoPedido | "";

  const where: Prisma.PedidoWhereInput = {
    ...(estadoFiltro ? { estado: estadoFiltro } : {}),
    ...(busqueda
      ? {
          OR: [
            { codigo: { contains: busqueda, mode: "insensitive" } },
            { cliente: { nombre: { contains: busqueda, mode: "insensitive" } } },
            { cliente: { telefono: { contains: busqueda } } },
            {
              items: {
                some: { producto: { nombre: { contains: busqueda, mode: "insensitive" } } },
              },
            },
          ],
        }
      : {}),
  };

  const pedidos = await prisma.pedido.findMany({
    where,
    include: { cliente: { select: { nombre: true, telefono: true } } },
    // Cola por orden de llegada -- el primero en entrar es el primero en la
    // lista, como pediste ("los pedidos se procesan normalmente por orden
    // de llegada").
    orderBy: { creadoEn: "asc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Pedidos</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"} en
            la cola, por orden de llegada.
          </p>
        </div>
        <Link
          href="/admin/pedidos/nuevo"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Nuevo pedido
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por código, cliente, teléfono o producto…"
          className="w-72 max-w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
        />
        <select
          name="estado"
          defaultValue={estadoFiltro}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_FILTRO.map((valor) => (
            <option key={valor} value={valor}>
              {ETIQUETA_ESTADO_PEDIDO[valor]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Recibido</th>
              <th className="px-4 py-3">Prometido</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pedidos.map((pedido, indice) => (
              <tr key={pedido.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-neutral-400">{indice + 1}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pedidos/${pedido.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    #{pedido.codigo}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {pedido.cliente.nombre}
                  <span className="block text-xs text-neutral-400">
                    {pedido.cliente.telefono}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {formatearFechaHoraHonduras(pedido.creadoEn)}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {pedido.fechaPrometida
                    ? formatearFechaHonduras(pedido.fechaPrometida)
                    : "Sin asignar"}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  L. {pedido.montoTotal.toString()}
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge
                    label={ETIQUETA_ESTADO_PEDIDO[pedido.estado as EstadoPedido]}
                    colorClasses={COLOR_ESTADO_PEDIDO[pedido.estado as EstadoPedido]}
                  />
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  {busqueda || estadoFiltro
                    ? "No hay pedidos que coincidan con tu búsqueda."
                    : "Todavía no hay pedidos registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
