import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminUsuario } from "@/lib/supabase/adminUsuario";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { formatearFechaHonduras } from "@/lib/fecha";
import { eliminarRegistroProduccion, eliminarRegistroMezcla } from "./actions";

export const metadata = { title: "Producción — Panel administrativo" };

export default async function ProduccionPage({
  searchParams,
}: {
  searchParams: Promise<{ empleadoId?: string }>;
}) {
  const { empleadoId } = await searchParams;
  const filtroEmpleadoId = (empleadoId || "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // "Pago por unidad" es una decisión del dueño (cuánto se le paga a cada
  // empleado por pieza) -- no algo que un EMPLEADO necesite tocar día a
  // día, así que ese enlace solo se muestra si el rol es ADMIN. Mismo
  // patrón que "Administrar tipos de pago" en Extras.
  const adminUsuario = user ? await obtenerAdminUsuario(user) : null;
  const esAdmin = adminUsuario?.rol === "ADMIN";

  const [registros, registrosMezcla, empleados] = await Promise.all([
    prisma.registroProduccion.findMany({
      where: filtroEmpleadoId ? { empleadoId: filtroEmpleadoId } : undefined,
      include: { empleado: true, producto: true },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
    prisma.registroMezcla.findMany({
      where: filtroEmpleadoId ? { empleadoId: filtroEmpleadoId } : undefined,
      include: { empleado: true },
      orderBy: { fecha: "desc" },
      take: 100,
    }),
    prisma.empleado.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const totalGanado = registros.reduce((suma, r) => suma + Number(r.totalGanado), 0);
  const totalMezcla = registrosMezcla.reduce((suma, r) => suma + Number(r.monto), 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Producción</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Últimos {registros.length} registro(s)
            {filtroEmpleadoId && " de este empleado"} — total L.{" "}
            {totalGanado.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {esAdmin && (
            <Link
              href="/admin/produccion/pago-unitario"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Pago por unidad
            </Link>
          )}
          <Link
            href="/admin/produccion/nuevo"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            + Nuevo registro
          </Link>
        </div>
      </div>

      <form className="mt-4 flex flex-wrap gap-2">
        <select
          name="empleadoId"
          defaultValue={filtroEmpleadoId}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        >
          <option value="">Todos los empleados</option>
          {empleados.map((empleado) => (
            <option key={empleado.id} value={empleado.id}>
              {empleado.nombre}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Defectuosas</th>
              <th className="px-4 py-3">Total ganado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {registros.map((registro) => (
              <tr key={registro.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-neutral-500">
                  {formatearFechaHonduras(registro.fecha)}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {registro.empleado.nombre}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {registro.producto.nombre}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {registro.cantidadProducida}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {registro.unidadesDefectuosas > 0
                    ? registro.unidadesDefectuosas
                    : "—"}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  L. {registro.totalGanado.toString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={eliminarRegistroProduccion.bind(null, registro.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="¿Borrar este registro de producción? Esto no se puede deshacer."
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Borrar
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  Todavía no hay registros de producción.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Mezcla</h2>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600">
          Últimos {registrosMezcla.length} registro(s)
          {filtroEmpleadoId && " de este empleado"} — total L.{" "}
          {totalMezcla.toFixed(2)}
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {registrosMezcla.map((registro) => (
                <tr key={registro.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-500">
                    {formatearFechaHonduras(registro.fecha)}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {registro.empleado.nombre}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    L. {registro.monto.toString()}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {registro.notas || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={eliminarRegistroMezcla.bind(null, registro.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="¿Borrar este registro de mezcla? Esto no se puede deshacer."
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Borrar
                      </ConfirmSubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
              {registrosMezcla.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    Todavía no hay registros de mezcla.
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
