"use client";

import { useActionState } from "react";
import { guardarPagoUnitario } from "../actions";
import { useToastAccion } from "@/components/admin/ui/Toast";

export function PagoUnitarioRow({
  productoId,
  nombre,
  montoActual,
}: {
  productoId: string;
  nombre: string;
  montoActual: string;
}) {
  const [state, formAction, pending] = useActionState(guardarPagoUnitario, {});
  useToastAccion(state, "Pago por unidad actualizado.");

  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-4 py-3 font-medium text-neutral-900">{nombre}</td>
      <td className="px-4 py-3">
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="productoId" value={productoId} />
          <span className="text-neutral-500">L.</span>
          <input
            type="number"
            name="monto"
            min="0"
            step="0.01"
            defaultValue={montoActual}
            className="w-28 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      </td>
    </tr>
  );
}
