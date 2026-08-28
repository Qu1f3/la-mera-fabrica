import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ETIQUETA_DISPONIBILIDAD, ETIQUETA_TIPO } from "@/lib/types";
import type { Disponibilidad, TipoProducto } from "@/lib/types";

export const metadata = { title: "Productos — Panel administrativo" };

export default async function ProductosPage() {
  const productos = await prisma.producto.findMany({
    orderBy: { creadoEn: "desc" },
    include: {
      categoria: { select: { nombre: true } },
      _count: { select: { imagenes: true } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Productos
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {productos.length}{" "}
            {productos.length === 1 ? "producto" : "productos"} en total.
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Disponibilidad</th>
              <th className="px-4 py-3">Fotos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {producto.nombre}
                  {producto.destacado && (
                    <span className="ml-2 rounded-full bg-terracota/10 px-2 py-0.5 text-xs font-medium text-terracota-dark">
                      Destacado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {ETIQUETA_TIPO[producto.tipo as TipoProducto]}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {producto.categoria?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {
                    ETIQUETA_DISPONIBILIDAD[
                      producto.disponibilidad as Disponibilidad
                    ]
                  }
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {producto._count.imagenes}
                </td>
                <td className="px-4 py-3">
                  {producto.activo ? (
                    <span className="text-green-700">Activo</span>
                  ) : (
                    <span className="text-neutral-400">Inactivo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/productos/${producto.id}`}
                    className="font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  Todavía no hay productos.{" "}
                  <Link
                    href="/admin/productos/nuevo"
                    className="font-medium text-neutral-700 underline"
                  >
                    Crea el primero
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
