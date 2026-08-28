import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { formatearFechaHonduras } from "@/lib/fecha";
import { eliminarMovimiento } from "./actions";
import { InventarioPanel } from "./InventarioPanel";
import { MarcarCompraPagadaForm } from "./MarcarCompraPagadaForm";

export const metadata = { title: "Inventario — Panel administrativo" };

export default async function InventarioPage() {
  const [materiales, movimientos, proveedores, comprasPendientes] = await Promise.all([
    prisma.materialInventario.findMany({
      include: { proveedor: true },
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    }),
    prisma.movimientoInventario.findMany({
      include: { material: true, compra: { include: { proveedor: true } } },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
    prisma.proveedor.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    // Compras a crédito que todavía no se han pagado -- ver
    // inventario/actions.ts::marcarCompraPagada.
    prisma.compra.findMany({
      where: { pagada: false },
      include: { proveedor: true, movimientos: { include: { material: true }, take: 1 } },
      orderBy: { fecha: "asc" },
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

  // Decimal de Prisma no se puede pasar tal cual a un Client Component --
  // se convierte a texto acá, igual que en el resto del proyecto.
  const materialesResumen = materiales.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    unidadMedida: m.unidadMedida,
    cantidadPorUnidad: m.cantidadPorUnidad.toString(),
    cantidadActual: m.cantidadActual.toString(),
    cantidadMinima: m.cantidadMinima.toString(),
    costo: m.costo ? m.costo.toString() : null,
    activo: m.activo,
    proveedorNombre: m.proveedor?.nombre ?? null,
  }));

  const comprasPendientesResumen = comprasPendientes.map((c) => ({
    id: c.id,
    proveedorNombre: c.proveedor.nombre,
    materialNombre: c.movimientos[0]?.material.nombre ?? null,
    montoTotal: c.montoTotal.toString(),
    fecha: formatearFechaHonduras(c.fecha),
  }));

  const tabMovimientos = (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
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
                {movimiento.compra ? (
                  <div>
                    <p>
                      {movimiento.compra.proveedor.nombre} — L.{" "}
                      {movimiento.compra.montoTotal.toString()}
                    </p>
                    {!movimiento.compra.pagada && (
                      <div className="mt-1 flex flex-col items-start gap-1">
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Pendiente de pago
                        </span>
                        <MarcarCompraPagadaForm compraId={movimiento.compra.id} />
                      </div>
                    )}
                  </div>
                ) : (
                  "—"
                )}
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
  );

  return (
    <InventarioPanel
      materiales={materialesResumen}
      proveedores={proveedores}
      materialesBajos={materialesBajos.map((m) => ({ id: m.id, nombre: m.nombre }))}
      comprasPendientes={comprasPendientesResumen}
      tabMovimientos={tabMovimientos}
    />
  );
}
