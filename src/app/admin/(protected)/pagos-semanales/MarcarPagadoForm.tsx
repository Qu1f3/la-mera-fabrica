"use client";

import { useActionState, useState } from "react";
import { marcarPagoSemanalPagado } from "./actions";

export function MarcarPagadoForm({
  pagoId,
  totalGanado,
}: {
  pagoId: string;
  totalGanado: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(
    marcarPagoSemanalPagado.bind(null, pagoId),
    {}
  );

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-xs font-medium text-emerald-700 hover:underline"
      >
        Marcar pagado
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center justify-end gap-1.5"
    >
      <input
        type="number"
        name="montoPagado"
        min="0"
        step="0.01"
        defaultValue={totalGanado}
        className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-900 focus:border-neutral-500 focus:outline-none"
      />
      <input
        type="date"
        name="fechaPago"
        className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-900 focus:border-neutral-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "…" : "Confirmar"}
      </button>
      {state.error && <p className="w-full text-right text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
