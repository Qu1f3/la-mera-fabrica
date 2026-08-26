import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { formatearFechaHonduras } from "@/lib/fecha";
import { eliminarMovimiento } from "./actions";

export const metadata = { title: "Inventario — Panel administrativo" };

export default async function InventarioPage() {
  const [materiales, movimientos] = await Promise.all([
    prisma.materialInventario.findMany({
      include: { proveedor: true },
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    }),
    prisma.movimientoInventario.findMany({
      include: { material: true, compra: { include: { proveedor: true } } },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
  ]);

  // Solo se marca "bajo" cuando de verdad se configuró un mínimo (> 0) --
  // si no, un material recién creado con 0/0 se vería como alerta falsa.
  const materialesBajos = materiales.filter(
    (m) =>
      m.activo &&
      Number(m.cantidadMinima) > 0 &&
      Number(m.cantidadActual) <= Number(m.cantidadMinima)
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Inventario</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            {materiales.length} {materiales.length === 1 ? "material" : "materiales"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/inventario/proveedores"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Proveedores
          </Link>
          <Link
            href="/admin/inventario/nuevo"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            + Nuevo material
          </Link>
          <Link
            href="/admin/inventario/movimientos/nuevo"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            + Registrar movimiento
          </Link>
        </div>
      </div>

      {materialesBajos.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span className="font-medium">Stock bajo:</span>{" "}
          {materialesBajos.map((m) => m.nombre).join(", ")}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Cantidad actual</th>
              <th className="px-4 py-3">Mínima</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {materiales.map((material) => {
              const bajo =
                material.activo &&
                Number(material.cantidadMinima) > 0 &&
                Number(material.cantidadActual) <= Number(material.cantidadMinima);
              return (
                <tr
                  key={material.id}
                  className={bajo ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-neutral-50"}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/inventario/${material.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {material.nombre}
                    </Link>
                    {Number(material.cantidadPorUnidad) !== 1 && (
                      <p className="text-xs text-neutral-500">
                        {material.cantidadPorUnidad.toString()} {material.unidadMedida} por unidad
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {material.proveedor?.nombre || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {material.cantidadActual.toString()} {material.unidadMedida}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {material.cantidadMinima.toString()} {material.unidadMedida}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {material.costo ? `L. ${material.costo.toString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                        material.activo
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-neutral-300 bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {material.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {materiales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  Todavía no hay materiales registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Movimientos</h2>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600">
          Últimos {movimientos.length} movimiento(s) de entrada/salida.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Costo</th>
                <th className="px-4 py-3">Compra / Proveedor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {movimientos.map((movimiento) => (
                <tr key={movimiento.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-500">
                    {formatearFechaHonduras(movimiento.fecha)}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {movimiento.material.nombre}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                        movimiento.tipo === "ENTRADA"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {movimiento.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {Number(movimiento.cantidadPorUnidad) === 1
                      ? `${movimiento.cantidad.toString()} ${movimiento.material.unidadMedida}`
                      : `${movimiento.cantidad.toString()} unidades (${(
                          Number(movimiento.cantidad) * Number(movimiento.cantidadPorUnidad)
                        ).toFixed(2)} ${movimiento.material.unidadMedida})`}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {movimiento.costo ? `L. ${movimiento.costo.toString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {movimiento.compra
                      ? `${movimiento.compra.proveedor.nombre} — L. ${movimiento.compra.montoTotal.toString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={eliminarMovimiento.bind(null, movimiento.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="¿Borrar este movimiento? Esto ajusta el stock del material y no se puede deshacer."
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Borrar
                      </ConfirmSubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                    Todavía no hay movimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
