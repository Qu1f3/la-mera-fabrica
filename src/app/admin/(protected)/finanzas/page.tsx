import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { claveDiaHonduras, formatearFechaHonduras, mesAdyacente, rangoMesHonduras } from "@/lib/fecha";
import { ETIQUETA_TIPO_GASTO, ETIQUETA_TIPO_INGRESO, type TipoGasto, type TipoIngreso } from "@/lib/types";
import { Tabs } from "@/components/admin/ui/Tabs";

export const metadata = { title: "Finanzas — Panel administrativo" };

function nombreMes(mesTexto: string): string {
  const [anio, mes] = mesTexto.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, 1));
  const texto = fecha.toLocaleDateString("es-HN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Finanzas es una vista de solo lectura -- no hay "Nuevo ingreso"/"Nuevo
 * gasto" a propósito. Los ingresos y gastos se generan solos a partir de lo
 * que ya se registra en otros módulos (nunca se piden dos veces):
 *   - Ingreso ANTICIPO: al crear un pedido (pedidos/actions.ts::crearPedido).
 *   - Ingreso PAGO_FINAL: al marcar un pedido como ENTREGADO
 *     (pedidos/actions.ts::cambiarEstadoPedido), por el saldo pendiente.
 *   - Gasto EMPLEADOS: al marcar un pago semanal como pagado
 *     (pagos-semanales/actions.ts::marcarPagoSemanalPagado).
 *   - Gasto MATERIALES: al registrar una entrada de inventario marcada
 *     como compra (inventario/actions.ts::registrarMovimiento).
 * Para corregir un monto hay que corregir la fuente (el pedido, el pago
 * semanal o el movimiento de inventario), no este listado -- así el número
 * nunca queda desincronizado de lo que realmente pasó.
 */
export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesValido = mes && /^\d{4}-\d{2}$/.test(mes);
  const mesActual = mesValido ? mes! : claveDiaHonduras(new Date()).slice(0, 7);
  const { inicio, fin } = rangoMesHonduras(mesActual);
  const mesAnterior = mesAdyacente(mesActual, -1);
  const mesSiguiente = mesAdyacente(mesActual, 1);
  const mesDeHoy = claveDiaHonduras(new Date()).slice(0, 7);

  const [ingresos, gastos] = await Promise.all([
    prisma.ingreso.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      include: { pedido: { select: { id: true, codigo: true } } },
      orderBy: { fecha: "desc" },
    }),
    prisma.gasto.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      orderBy: { fecha: "desc" },
    }),
  ]);

  const totalIngresos = ingresos.reduce((suma, i) => suma + Number(i.monto), 0);
  const totalGastos = gastos.reduce((suma, g) => suma + Number(g.monto), 0);
  const utilidad = totalIngresos - totalGastos;

  const tabIngresos = (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Descripción</th>
            <th className="px-4 py-3">Pedido</th>
            <th className="px-4 py-3">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {ingresos.map((ingreso) => (
            <tr key={ingreso.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3 text-neutral-500">
                {formatearFechaHonduras(ingreso.fecha)}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {ETIQUETA_TIPO_INGRESO[ingreso.categoria as TipoIngreso]}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-700">{ingreso.descripcion || "—"}</td>
              <td className="px-4 py-3 text-neutral-500">
                {ingreso.pedido ? (
                  <Link href={`/admin/pedidos/${ingreso.pedido.id}`} className="hover:underline">
                    {ingreso.pedido.codigo}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 font-medium text-neutral-900">
                L. {ingreso.monto.toString()}
              </td>
            </tr>
          ))}
          {ingresos.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                Sin ingresos este mes. Se generan solos al crear un pedido (anticipo) y al
                entregarlo (pago final).
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const tabGastos = (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Descripción</th>
            <th className="px-4 py-3">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {gastos.map((gasto) => (
            <tr key={gasto.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3 text-neutral-500">
                {formatearFechaHonduras(gasto.fecha)}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  {ETIQUETA_TIPO_GASTO[gasto.categoria as TipoGasto]}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-700">{gasto.descripcion || "—"}</td>
              <td className="px-4 py-3 font-medium text-neutral-900">
                L. {gasto.monto.toString()}
              </td>
            </tr>
          ))}
          {gastos.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                Sin gastos este mes. Se generan solos al marcar un pago semanal como pagado y
                al registrar una compra de inventario.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Finanzas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/finanzas?mes=${mesAnterior}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            ← Anterior
          </Link>
          <Link
            href={`/admin/finanzas?mes=${mesDeHoy}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Hoy
          </Link>
          <Link
            href={`/admin/finanzas?mes=${mesSiguiente}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Siguiente →
          </Link>
        </div>
      </div>
      <p className="mt-1 text-lg font-medium text-neutral-800">{nombreMes(mesActual)}</p>
      <p className="mt-1 max-w-2xl text-sm text-neutral-500">
        Todo lo de abajo se genera solo. Para corregir un monto, corrige el pedido, el pago
        semanal o el movimiento de inventario que lo originó.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Ingresos</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">
            L. {totalIngresos.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">Gastos</p>
          <p className="mt-1 text-2xl font-semibold text-red-800">L. {totalGastos.toFixed(2)}</p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            utilidad >= 0
              ? "border-neutral-200 bg-neutral-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Utilidad</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              utilidad >= 0 ? "text-neutral-900" : "text-amber-800"
            }`}
          >
            L. {utilidad.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { clave: "ingresos", etiqueta: "Ingresos", contenido: tabIngresos },
            { clave: "gastos", etiqueta: "Gastos", contenido: tabGastos },
          ]}
        />
      </div>
    </div>
  );
}
