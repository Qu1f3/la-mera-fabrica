"use client";

import { useActionState } from "react";
import { actualizarExistencia } from "../actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function EditarExistenciaForm({
  existenciaId,
  cantidadInicial,
  notasIniciales,
}: {
  existenciaId: string;
  cantidadInicial: number;
  notasIniciales: string;
}) {
  const [state, formAction, pending] = useActionState(
    actualizarExistencia.bind(null, existenciaId),
    {}
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3">
      {/* El mosaico ligado a este registro no se puede cambiar acá -- si es
          el mosaico equivocado, se borra este registro y se crea uno nuevo
          para el correcto (ver actions.ts::actualizarExistencia). */}
      <label className="text-xs text-neutral-500">
        Cantidad en bodega
        <input
          type="number"
          name="cantidad"
          min="0"
          step="1"
          defaultValue={cantidadInicial}
          className={`${inputClass} mt-1`}
        />
      </label>

      <label className="text-xs text-neutral-500">
        Nota (opcional)
        <input name="notas" defaultValue={notasIniciales} className={`${inputClass} mt-1`} />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:w-fit"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
