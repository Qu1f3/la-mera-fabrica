import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { obtenerAdminUsuario } from "@/lib/supabase/adminUsuario";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { formatearFechaHonduras } from "@/lib/fecha";
import { NuevoTipoPagoExtraForm } from "./NuevoTipoPagoExtraForm";
import { TipoPagoExtraToggle } from "./TipoPagoExtraToggle";
import { NuevoPagoExtraForm } from "./NuevoPagoExtraForm";
import { eliminarPagoExtra } from "./actions";

export const metadata = { title: "Extras — Panel administrativo" };

export default async function ExtrasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // El Proxy y el layout protegido ya garantizan que haya sesión antes de
  // llegar aquí; se vuelve a resolver el AdminUsuario (misma consulta
  // liviana que ya hace el layout) solo para saber el rol y decidir si se
  // muestra "Administrar tipos de pago" -- ver comentario en esa sección
  // más abajo para el porqué.
  const adminUsuario = user ? await obtenerAdminUsuario(user) : null;
  const esAdmin = adminUsuario?.rol === "ADMIN";

  const [tipos, pagos, empleados] = await Promise.all([
    prisma.tipoPagoExtra.findMany({ orderBy: { descripcion: "asc" } }),
    prisma.pagoExtraEmpleado.findMany({
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

  const tiposActivos = tipos
    .filter((t) => t.activo)
    .map((t) => ({
      id: t.id,
      descripcion: t.descripcion,
      montoSugerido: t.montoSugerido ? t.montoSugerido.toString() : null,
    }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Pagos extra
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Pagos adicionales por tareas fuera de la producción normal (ej:
        cargar un pedido al camión).
      </p>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Registrar un pago extra
        </h2>
        <NuevoPagoExtraForm empleados={empleados} tipos={tiposActivos} />
      </div>

      {/*
        "Administrar tipos de pago" es trabajo de configuración (definir qué
        tipos de trabajo extra existen), no algo que se use en el día a día
        -- se deja colapsado por default (<details>, sin JS) y, además,
        solo se muestra si el AdminUsuario es ADMIN. Un EMPLEADO (ej. la
        mamá de Roberto) solo necesita "Registrar un pago extra"; ver esos
        tipos ya definidos como botones ahí arriba le alcanza, no necesita
        poder crear/desactivar tipos nuevos.
      */}
      {esAdmin && (
        <details className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-700 select-none">
            Administrar tipos de pago
          </summary>
          <div className="mt-3">
            <ul className="divide-y divide-neutral-100">
              {tipos.map((tipo) => (
                <li
                  key={tipo.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className={tipo.activo ? "text-neutral-900" : "text-neutral-400"}>
                    {tipo.descripcion}
                    {tipo.montoSugerido && (
                      <span className="ml-2 text-neutral-500">
                        (sugerido L. {tipo.montoSugerido.toString()})
                      </span>
                    )}
                  </span>
                  <TipoPagoExtraToggle id={tipo.id} activo={tipo.activo} />
                </li>
              ))}
              {tipos.length === 0 && (
                <li className="py-2 text-sm text-neutral-500">
                  Todavía no hay tipos de pago extra.
                </li>
              )}
            </ul>
            <NuevoTipoPagoExtraForm />
          </div>
        </details>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pagos.map((pago) => (
              <tr key={pago.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-neutral-500">
                  {formatearFechaHonduras(pago.fecha)}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {pago.empleado.nombre}
                </td>
                <td className="px-4 py-3 text-neutral-700">{pago.descripcion}</td>
                <td className="px-4 py-3 text-neutral-700">
                  L. {pago.monto.toString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={eliminarPagoExtra.bind(null, pago.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="¿Borrar este pago extra? Esto no se puede deshacer."
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Borrar
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  Todavía no hay pagos extra registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
