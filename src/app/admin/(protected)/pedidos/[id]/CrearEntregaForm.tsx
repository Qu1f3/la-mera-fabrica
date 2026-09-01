"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { crearEntrega } from "../actions";

export function CrearEntregaForm({ pedidoId }: { pedidoId: string }) {
  const [state, formAction] = useActionState(
    crearEntrega.bind(null, pedidoId),
    {}
  );
  useToastAccion(state, "Entrega programada.");

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="text-sm text-neutral-700">
        Fecha programada (opcional)
        <input
          type="date"
          name="fechaProgramada"
          className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        />
      </label>
      <input
        name="notas"
        placeholder="Notas (opcional)"
        className="min-w-[180px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
      />
      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Programar entrega
      </button>
    </form>
  );
}
