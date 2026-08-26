import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { EditarProveedorForm } from "./EditarProveedorForm";
import { alternarActivoProveedor, eliminarProveedor } from "../../actions";

export const metadata = { title: "Ficha de proveedor — Panel administrativo" };

export default async function FichaProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) notFound();

  const [totalMateriales, totalCompras] = await Promise.all([
    prisma.materialInventario.count({ where: { proveedorId: id } }),
    prisma.compra.count({ where: { proveedorId: id } }),
  ]);
  const tieneHistorial = totalMateriales + totalCompras > 0;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/inventario/proveedores"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Proveedores
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {proveedor.nombre}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {proveedor.activo ? "Activo" : "Inactivo"}
          </p>
        </div>
        <form
          action={alternarActivoProveedor.bind(null, proveedor.id, !proveedor.activo)}
        >
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            {proveedor.activo ? "Marcar inactivo" : "Marcar activo"}
          </button>
        </form>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Datos</h2>
        <EditarProveedorForm
          proveedorId={proveedor.id}
          nombre={proveedor.nombre}
          telefono={proveedor.telefono ?? ""}
          notas={proveedor.notas ?? ""}
        />
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Actividad</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-neutral-500">Materiales</dt>
            <dd className="font-semibold text-neutral-900">{totalMateriales}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Compras</dt>
            <dd className="font-semibold text-neutral-900">{totalCompras}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        {tieneHistorial ? (
          <p className="mt-1 text-sm text-neutral-600">
            No se puede borrar: este proveedor tiene materiales o compras
            asociadas. Usa &quot;Marcar inactivo&quot; en vez de borrarlo.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-neutral-600">
              Borrar este proveedor no se puede deshacer.
            </p>
            <form
              action={eliminarProveedor.bind(null, proveedor.id)}
              className="mt-3"
            >
              <ConfirmSubmitButton
                confirmMessage={`¿Borrar a "${proveedor.nombre}" para siempre? Esto no se puede deshacer.`}
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Borrar proveedor
              </ConfirmSubmitButton>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
