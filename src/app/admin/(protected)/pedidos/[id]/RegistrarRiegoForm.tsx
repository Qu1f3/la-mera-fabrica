"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { registrarRiego } from "../actions";

export function RegistrarRiegoForm({ pedidoId }: { pedidoId: string }) {
  const [state, formAction] = useActionState(
    registrarRiego.bind(null, pedidoId),
    {}
  );
  useToastAccion(state, "Riego registrado.");

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex-1 text-sm text-neutral-700">
        Observación (opcional)
        <input
          name="observacion"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Registrar riego de hoy
      </button>
    </form>
  );
}
