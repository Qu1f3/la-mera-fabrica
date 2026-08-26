import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { formatearFechaHonduras } from "@/lib/fecha";
import { EditarMaterialForm } from "./EditarMaterialForm";
import {
  alternarActivoMaterial,
  eliminarMaterial,
  eliminarMovimiento,
} from "../actions";

export const metadata = { title: "Ficha de material — Panel administrativo" };

export default async function FichaMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [material, proveedores] = await Promise.all([
    prisma.materialInventario.findUnique({
      where: { id },
      include: {
        movimientos: {
          orderBy: { fecha: "desc" },
          include: { compra: { include: { proveedor: true } } },
        },
      },
    }),
    prisma.proveedor.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);
  if (!material) notFound();

  const tieneMovimientos = material.movimientos.length > 0;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/inventario"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Inventario
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {material.nombre}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {material.activo ? "Activo" : "Inactivo"} — cantidad actual:{" "}
            <span className="font-semibold text-neutral-900">
              {material.cantidadActual.toString()} {material.unidadMedida}
            </span>
          </p>
        </div>
        <form action={alternarActivoMaterial.bind(null, material.id, !material.activo)}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            {material.activo ? "Marcar inactivo" : "Marcar activo"}
          </button>
        </form>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Datos</h2>
        <EditarMaterialForm
          materialId={material.id}
          nombre={material.nombre}
          unidadMedida={material.unidadMedida}
          cantidadPorUnidad={material.cantidadPorUnidad.toString()}
          cantidadMinima={material.cantidadMinima.toString()}
          costo={material.costo ? material.costo.toString() : ""}
          proveedorIdInicial={material.proveedorId ?? ""}
          notas={material.notas ?? ""}
          proveedores={proveedores}
        />
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Movimientos</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Compra</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {material.movimientos.map((movimiento) => (
                <tr key={movimiento.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 text-neutral-500">
                    {formatearFechaHonduras(movimiento.fecha)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        movimiento.tipo === "ENTRADA"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {Number(movimiento.cantidadPorUnidad) === 1
                      ? `${movimiento.cantidad.toString()} ${material.unidadMedida}`
                      : `${movimiento.cantidad.toString()} unidades (${(
                          Number(movimiento.cantidad) * Number(movimiento.cantidadPorUnidad)
                        ).toFixed(2)} ${material.unidadMedida})`}
                  </td>
                  <td className="px-3 py-2 text-neutral-500">
                    {movimiento.compra
                      ? `${movimiento.compra.proveedor.nombre} — L. ${movimiento.compra.montoTotal.toString()}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={eliminarMovimiento.bind(null, movimiento.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="¿Borrar este movimiento? Esto ajusta el stock y no se puede deshacer."
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Borrar
                      </ConfirmSubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {material.movimientos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-neutral-500">
                    Todavía no hay movimientos para este material.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        {tieneMovimientos ? (
          <p className="mt-1 text-sm text-neutral-600">
            No se puede borrar: este material tiene movimientos registrados.
            Usa &quot;Marcar inactivo&quot; en vez de borrarlo.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-neutral-600">
              Borrar este material no se puede deshacer.
            </p>
            <form action={eliminarMaterial.bind(null, material.id)} className="mt-3">
              <ConfirmSubmitButton
                confirmMessage={`¿Borrar "${material.nombre}" para siempre? Esto no se puede deshacer.`}
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Borrar material
              </ConfirmSubmitButton>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
