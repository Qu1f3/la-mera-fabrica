"use client";

import { useActionState, useMemo, useState } from "react";
import { generarPagoSemanal } from "./actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevoPagoSemanalForm({
  empleados,
}: {
  empleados: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(generarPagoSemanal, {});
  const [empleadoId, setEmpleadoId] = useState("");

  const opcionesEmpleado = useMemo(
    () => empleados.map((e) => ({ id: e.id, etiqueta: e.nombre })),
    [empleados]
  );

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
      <label className="text-xs text-neutral-500">
        Empleado
        <Combobox
          opciones={opcionesEmpleado}
          valorId={empleadoId}
          onSeleccionar={setEmpleadoId}
          placeholder="Escribe para buscar…"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Inicio de semana
        <input type="date" name="semanaInicio" required className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-neutral-500">
        Fin de semana
        <input type="date" name="semanaFin" required className={`${inputClass} mt-1`} />
      </label>
      <input type="hidden" name="empleadoId" value={empleadoId} />
      <button
        type="submit"
        disabled={pending || !empleadoId}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Calculando…" : "Generar / recalcular"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-4">{state.error}</p>
      )}
    </form>
  );
}
