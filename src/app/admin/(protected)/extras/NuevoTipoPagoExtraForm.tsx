"use client";

import { useActionState } from "react";
import { crearTipoPagoExtra } from "./actions";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevoTipoPagoExtraForm() {
  const [state, formAction, pending] = useActionState(crearTipoPagoExtra, {});

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
      <label className="text-xs text-neutral-500">
        Descripción
        <input name="descripcion" required className={`${inputClass} mt-1 w-56`} />
      </label>
      <label className="text-xs text-neutral-500">
        Monto sugerido (opcional)
        <input
          type="number"
          name="montoSugerido"
          min="0"
          step="0.01"
          className={`${inputClass} mt-1 w-32`}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Agregar tipo"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
