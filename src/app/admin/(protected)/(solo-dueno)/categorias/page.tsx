import { prisma } from "@/lib/prisma";
import { FilaCategoria } from "./FilaCategoria";
import { NuevaCategoriaForm } from "./NuevaCategoriaForm";

export const metadata = { title: "Categorías — Panel administrativo" };

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
              <FilaCategoria key={categoria.id} categoria={categoria} />
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
        <NuevaCategoriaForm siguienteOrden={categorias.length} />
      </div>
    </div>
  );
}
