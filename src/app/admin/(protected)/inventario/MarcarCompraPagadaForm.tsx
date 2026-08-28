"use client";

import { useActionState, useState } from "react";
import { marcarCompraPagada } from "./actions";

/**
 * Botón + mini-formulario para marcar como pagada una compra a crédito
 * (misma idea que MarcarPagadoForm.tsx en pagos-semanales): no pide el
 * monto porque ya se conoce (montoTotal de la Compra), solo la fecha en
 * que de verdad se pagó -- si se deja vacía, la acción usa hoy.
 */
export function MarcarCompraPagadaForm({ compraId }: { compraId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(
    marcarCompraPagada.bind(null, compraId),
    {}
  );

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="shrink-0 text-xs font-medium text-emerald-700 hover:underline"
      >
        Marcar pagada
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end gap-1.5">
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
