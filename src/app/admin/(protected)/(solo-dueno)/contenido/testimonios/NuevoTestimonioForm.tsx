"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { crearTestimonio } from "./actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevoTestimonioForm() {
  const [state, formAction] = useActionState(crearTestimonio, {});
  useToastAccion(state, "Testimonio creado.");

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="nombreCliente"
          placeholder="Nombre del cliente"
          required
          className={inputClass}
        />
        <input
          type="number"
          name="calificacion"
          min={1}
          max={5}
          placeholder="Calificación 1-5 (opcional)"
          className={inputClass}
        />
      </div>
      <textarea
        name="texto"
        placeholder="Lo que dijo el cliente"
        required
        rows={2}
        className={inputClass}
      />
      <input
        name="fotoUrl"
        placeholder="Enlace a foto del cliente (opcional)"
        className={inputClass}
      />
      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Agregar testimonio
      </button>
    </form>
  );
}
