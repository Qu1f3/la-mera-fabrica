import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearFechaHonduras } from "@/lib/fecha";
import { NuevoClienteForm } from "./NuevoClienteForm";

export const metadata = { title: "Clientes — Panel administrativo" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const busqueda = (q || "").trim();

  const clientes = await prisma.cliente.findMany({
    where: busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda, mode: "insensitive" } },
            { telefono: { contains: busqueda } },
          ],
        }
      : undefined,
    include: { _count: { select: { pedidos: true } } },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Clientes</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
            {busqueda && ` que coinciden con "${busqueda}"`}
          </p>
        </div>
        <form className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por nombre o teléfono…"
            className="w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Pedidos</th>
              <th className="px-4 py-3">Cliente desde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clientes/${cliente.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {cliente.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">{cliente.telefono}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {cliente._count.pedidos}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {formatearFechaHonduras(cliente.creadoEn)}
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-neutral-500"
                >
                  {busqueda
                    ? "No hay clientes que coincidan con tu búsqueda."
                    : "Todavía no hay clientes registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Nuevo cliente
        </h2>
        <NuevoClienteForm />
      </div>
    </div>
  );
}
