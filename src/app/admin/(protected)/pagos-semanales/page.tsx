import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { formatearFechaHonduras } from "@/lib/fecha";
import { NuevoPagoSemanalForm } from "./NuevoPagoSemanalForm";
import { MarcarPagadoForm } from "./MarcarPagadoForm";
import { eliminarPagoSemanal, marcarPagoSemanalPendiente } from "./actions";

export const metadata = { title: "Pagos semanales — Panel administrativo" };

export default async function PagosSemanalesPage() {
  const [pagos, empleados] = await Promise.all([
    prisma.pagoEmpleado.findMany({
      include: { empleado: true },
      orderBy: [{ semanaInicio: "desc" }, { empleado: { nombre: "asc" } }],
      take: 100,
    }),
    prisma.empleado.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const totalPendiente = pagos
    .filter((p) => p.estado === "PENDIENTE")
    .reduce((suma, p) => suma + Number(p.totalGanado), 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Pagos semanales
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Suma producción + mezcla + extras de cada empleado en el rango de
        fechas indicado. Total pendiente de pago: L. {totalPendiente.toFixed(2)}
      </p>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Generar pago semanal
        </h2>
        <NuevoPagoSemanalForm empleados={empleados} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Semana</th>
              <th className="px-4 py-3">Producción</th>
              <th className="px-4 py-3">Mezcla</th>
              <th className="px-4 py-3">Extras</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pagos.map((pago) => (
              <tr key={pago.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {pago.empleado.nombre}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {formatearFechaHonduras(pago.semanaInicio)} –{" "}
                  {formatearFechaHonduras(pago.semanaFin)}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  L. {pago.totalProduccion.toString()}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  L. {pago.totalMezcla.toString()}
                </td>
                <td
                  className={`px-4 py-3 ${
                    Number(pago.totalExtras) < 0 ? "font-medium text-red-600" : "text-neutral-600"
                  }`}
                >
                  L. {pago.totalExtras.toString()}
                </td>
                <td className="px-4 py-3 font-semibold text-neutral-900">
                  L. {pago.totalGanado.toString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      pago.estado === "PAGADO"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {pago.estado === "PAGADO" ? "Pagado" : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-1.5">
                    {pago.estado === "PENDIENTE" ? (
                      <MarcarPagadoForm
                        pagoId={pago.id}
                        totalGanado={pago.totalGanado.toString()}
                      />
                    ) : (
                      <form action={marcarPagoSemanalPendiente.bind(null, pago.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-neutral-500 hover:underline"
                        >
                          Marcar pendiente
                        </button>
                      </form>
                    )}
                    <form action={eliminarPagoSemanal.bind(null, pago.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="¿Borrar este pago semanal? Esto no se puede deshacer."
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Borrar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-500">
                  Todavía no hay pagos semanales generados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
