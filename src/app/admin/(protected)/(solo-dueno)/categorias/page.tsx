import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
} from "./actions";

export const metadata = { title: "Categorías — Panel administrativo" };

const inputClass =
  "rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export default async function CategoriasPage() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: "asc" },
    include: { _count: { select: { productos: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Categorías</h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Se usan para navegar el catálogo por estilo o colección. El orden
        controla en qué posición aparecen en los filtros públicos.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Activa</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {categorias.map((categoria) => (
              <tr key={categoria.id}>
                <td colSpan={6} className="p-0">
                  <form
                    action={actualizarCategoria.bind(null, categoria.id)}
                    className="grid grid-cols-6 items-center gap-2 px-4 py-2.5"
                  >
                    <input
                      name="nombre"
                      defaultValue={categoria.nombre}
                      required
                      className={inputClass}
                    />
                    <input
                      name="slug"
                      defaultValue={categoria.slug}
                      className={`${inputClass} text-neutral-500`}
                    />
                    <input
                      type="number"
                      name="orden"
                      defaultValue={categoria.orden}
                      className={`${inputClass} w-20`}
                    />
                    <input
                      type="checkbox"
                      name="activo"
                      defaultChecked={categoria.activo}
                      className="h-4 w-4"
                    />
                    <span className="text-neutral-500">
                      {categoria._count.productos}
                    </span>
                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                      >
                        Guardar
                      </button>
                      <ConfirmSubmitButton
                        formAction={eliminarCategoria.bind(null, categoria.id)}
                        confirmMessage={`¿Borrar la categoría "${categoria.nombre}"? Los productos que la usan quedan sin categoría, no se borran.`}
                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Borrar
                      </ConfirmSubmitButton>
                    </div>
                  </form>
                </td>
              </tr>
            ))}
            {categorias.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  Todavía no hay categorías.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Nueva categoría
        </h2>
        <form
          action={crearCategoria}
          className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4"
        >
          <input
            name="nombre"
            placeholder="Nombre (ej: Rústico)"
            required
            className={inputClass}
          />
          <input
            name="slug"
            placeholder="Slug (opcional, se genera solo)"
            className={inputClass}
          />
          <input
            type="number"
            name="orden"
            placeholder="Orden"
            defaultValue={categorias.length}
            className={inputClass}
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Agregar categoría
          </button>
        </form>
      </div>
    </div>
  );
}
