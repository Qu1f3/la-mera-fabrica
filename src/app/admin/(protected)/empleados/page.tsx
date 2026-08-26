import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearFechaHonduras } from "@/lib/fecha";
import { NuevoEmpleadoForm } from "./NuevoEmpleadoForm";

export const metadata = { title: "Empleados — Panel administrativo" };

export default async function EmpleadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q, estado } = await searchParams;
  const busqueda = (q || "").trim();
  const soloInactivos = estado === "inactivos";

  const empleados = await prisma.empleado.findMany({
    where: {
      ...(busqueda ? { nombre: { contains: busqueda, mode: "insensitive" } } : {}),
      ...(soloInactivos ? { activo: false } : estado === "activos" ? { activo: true } : {}),
    },
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Empleados</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            {empleados.length} {empleados.length === 1 ? "empleado" : "empleados"}
            {busqueda && ` que coinciden con "${busqueda}"`}
          </p>
        </div>
        <form className="flex flex-wrap gap-2">
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por nombre…"
            className="w-56 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
          />
          <select
            name="estado"
            defaultValue={estado || ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Filtrar
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {empleados.map((empleado) => (
              <tr key={empleado.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/empleados/${empleado.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {empleado.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {empleado.telefono || "—"}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {empleado.fechaIngreso
                    ? formatearFechaHonduras(empleado.fechaIngreso)
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      empleado.activo
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-neutral-300 bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {empleado.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
            {empleados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  {busqueda
                    ? "No hay empleados que coincidan con tu búsqueda."
                    : "Todavía no hay empleados registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Nuevo empleado</h2>
        <NuevoEmpleadoForm />
      </div>
    </div>
  );
}
