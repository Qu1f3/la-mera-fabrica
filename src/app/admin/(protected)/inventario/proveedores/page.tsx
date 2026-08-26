import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NuevoProveedorForm } from "./NuevoProveedorForm";

export const metadata = { title: "Proveedores — Panel administrativo" };

export default async function ProveedoresPage() {
  const proveedores = await prisma.proveedor.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });

  return (
    <div>
      <Link
        href="/admin/inventario"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Inventario
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Proveedores</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            {proveedores.length}{" "}
            {proveedores.length === 1 ? "proveedor" : "proveedores"}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {proveedores.map((proveedor) => (
              <tr key={proveedor.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/inventario/proveedores/${proveedor.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {proveedor.nombre}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {proveedor.telefono || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      proveedor.activo
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-neutral-300 bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {proveedor.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
            {proveedores.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                  Todavía no hay proveedores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Nuevo proveedor</h2>
        <NuevoProveedorForm />
      </div>
    </div>
  );
}
