import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { eliminarCombinacion } from "../actions";
import { EditarCombinacionForm } from "./EditarCombinacionForm";
import { componenteVacio, type ComponenteFormulario } from "../tipos";

export const metadata = { title: "Combinación — Panel administrativo" };

export default async function FichaCombinacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const combinacion = await prisma.combinacionMosaico.findUnique({
    where: { id },
    include: {
      producto: { select: { nombre: true, sku: true } },
      componentes: { orderBy: { orden: "asc" } },
    },
  });
  if (!combinacion) notFound();

  const componentesIniciales: ComponenteFormulario[] =
    combinacion.componentes.length > 0
      ? combinacion.componentes.map((c) => ({
          key: c.id,
          nombre: c.nombre,
          cementoCantidad: c.cementoCantidad !== null ? c.cementoCantidad.toString() : "",
          cementoUnidad: c.cementoUnidad ?? "kg",
          coloranteColor: c.coloranteColor ?? "",
          coloranteCantidad: c.coloranteCantidad !== null ? c.coloranteCantidad.toString() : "",
          coloranteUnidad: c.coloranteUnidad ?? "lb",
          notas: c.notas ?? "",
        }))
      : [componenteVacio("nuevo-1")];

  return (
    <div className="max-w-2xl">
      <Link href="/admin/combinaciones" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Combinaciones
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        {combinacion.producto.nombre}
        {combinacion.producto.sku && (
          <span className="ml-1.5 text-sm font-normal text-neutral-400">
            ({combinacion.producto.sku})
          </span>
        )}
      </h1>

      <section className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <EditarCombinacionForm
          combinacionId={combinacion.id}
          notasIniciales={combinacion.notas ?? ""}
          componentesIniciales={componentesIniciales}
        />
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Borrar esta combinación no se puede deshacer.
        </p>
        <form action={eliminarCombinacion.bind(null, combinacion.id)} className="mt-3">
          <ConfirmSubmitButton
            confirmMessage={`¿Borrar la combinación de "${combinacion.producto.nombre}" para siempre? Esto no se puede deshacer.`}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Borrar combinación
          </ConfirmSubmitButton>
        </form>
      </section>
    </div>
  );
}
