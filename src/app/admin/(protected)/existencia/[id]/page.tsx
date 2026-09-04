import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { eliminarExistencia } from "../actions";
import { EditarExistenciaForm } from "./EditarExistenciaForm";

export const metadata = { title: "Existencia — Panel administrativo" };

export default async function FichaExistenciaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const existencia = await prisma.existenciaMosaico.findUnique({
    where: { id },
    include: { producto: { select: { nombre: true, sku: true } } },
  });
  if (!existencia) notFound();

  return (
    <div className="max-w-md">
      <Link href="/admin/existencia" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Existencia
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        {existencia.producto.nombre}
        {existencia.producto.sku && (
          <span className="ml-1.5 text-sm font-normal text-neutral-400">
            ({existencia.producto.sku})
          </span>
        )}
      </h1>

      <section className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <EditarExistenciaForm
          existenciaId={existencia.id}
          cantidadInicial={existencia.cantidad}
          notasIniciales={existencia.notas ?? ""}
        />
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Borrar este registro no se puede deshacer.
        </p>
        <form action={eliminarExistencia.bind(null, existencia.id)} className="mt-3">
          <ConfirmSubmitButton
            confirmMessage={`¿Borrar la existencia de "${existencia.producto.nombre}" para siempre? Esto no se puede deshacer.`}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Borrar registro
          </ConfirmSubmitButton>
        </form>
      </section>
    </div>
  );
}
