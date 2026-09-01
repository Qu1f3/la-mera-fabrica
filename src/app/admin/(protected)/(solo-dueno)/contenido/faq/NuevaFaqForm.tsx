"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { crearFaq } from "./actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevaFaqForm({ siguienteOrden }: { siguienteOrden: number }) {
  const [state, formAction] = useActionState(crearFaq, {});
  useToastAccion(state, "Pregunta creada.");

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <input
        name="pregunta"
        placeholder="Pregunta"
        required
        className={inputClass}
      />
      <textarea
        name="respuesta"
        placeholder="Respuesta"
        required
        rows={2}
        className={inputClass}
      />
      <div className="flex items-center gap-3">
        <input
          type="number"
          name="orden"
          placeholder="Orden"
          defaultValue={siguienteOrden}
          className={`${inputClass} w-24`}
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Agregar pregunta
        </button>
      </div>
    </form>
  );
}
