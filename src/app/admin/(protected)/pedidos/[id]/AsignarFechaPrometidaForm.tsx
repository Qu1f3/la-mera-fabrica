"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { asignarFechaPrometida } from "../actions";

export function AsignarFechaPrometidaForm({
  pedidoId,
  fechaInicial,
}: {
  pedidoId: string;
  fechaInicial: string;
}) {
  const [state, formAction] = useActionState(
    asignarFechaPrometida.bind(null, pedidoId),
    {}
  );
  useToastAccion(state, "Fecha prometida guardada.");

  return (
    <form action={formAction} className="mt-1 flex flex-wrap items-end gap-2">
      <label className="text-sm text-neutral-700">
        Fecha prometida
        <input
          type="date"
          name="fechaPrometida"
          defaultValue={fechaInicial}
          className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        />
      </label>
      <button
        type="submit"
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
      >
        Guardar
      </button>
    </form>
  );
}
