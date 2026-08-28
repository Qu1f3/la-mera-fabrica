import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { formatearFechaHonduras } from "@/lib/fecha";
import { claveDiaHonduras } from "@/lib/fecha";
import { EditarEmpleadoForm } from "./EditarEmpleadoForm";
import { alternarActivoEmpleado, eliminarEmpleado } from "../actions";

export const metadata = { title: "Ficha de empleado — Panel administrativo" };

export default async function FichaEmpleadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const empleado = await prisma.empleado.findUnique({ where: { id } });
  if (!empleado) notFound();

  const [totalProducciones, totalMezclas, totalExtras, totalPagos] = await Promise.all([
    prisma.registroProduccion.count({ where: { empleadoId: id } }),
    prisma.registroMezcla.count({ where: { empleadoId: id } }),
    prisma.pagoExtraEmpleado.count({ where: { empleadoId: id } }),
    prisma.pagoEmpleado.count({ where: { empleadoId: id } }),
  ]);
  const tieneHistorial =
    totalProducciones + totalMezclas + totalExtras + totalPagos > 0;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/empleados"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Empleados
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {empleado.nombre}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {empleado.activo ? "Activo" : "Inactivo"}
            {empleado.fechaIngreso &&
              ` — desde el ${formatearFechaHonduras(empleado.fechaIngreso)}`}
          </p>
        </div>
        <form action={alternarActivoEmpleado.bind(null, empleado.id, !empleado.activo)}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            {empleado.activo ? "Marcar inactivo" : "Marcar activo"}
          </button>
        </form>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Datos</h2>
        <EditarEmpleadoForm
          empleadoId={empleado.id}
          nombre={empleado.nombre}
          telefono={empleado.telefono ?? ""}
          notas={empleado.notas ?? ""}
          fechaIngreso={
            empleado.fechaIngreso ? claveDiaHonduras(empleado.fechaIngreso) : ""
          }
        />
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Actividad</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-neutral-500">Producción</dt>
            <dd className="font-semibold text-neutral-900">{totalProducciones}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Mezcla</dt>
            <dd className="font-semibold text-neutral-900">{totalMezclas}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Extras</dt>
            <dd className="font-semibold text-neutral-900">{totalExtras}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Pagos semanales</dt>
            <dd className="font-semibold text-neutral-900">{totalPagos}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        {tieneHistorial ? (
          <p className="mt-1 text-sm text-neutral-600">
            No se puede borrar: este empleado tiene registros de producción,
            mezcla, extras o pagos. Usa &quot;Marcar inactivo&quot; en vez de
            borrarlo.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-neutral-600">
              Borrar este empleado no se puede deshacer.
            </p>
            <form action={eliminarEmpleado.bind(null, empleado.id)} className="mt-3">
              <ConfirmSubmitButton
                confirmMessage={`¿Borrar a "${empleado.nombre}" para siempre? Esto no se puede deshacer.`}
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Borrar empleado
              </ConfirmSubmitButton>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
