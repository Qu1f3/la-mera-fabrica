"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { crearCategoria } from "./actions";

const inputClass =
  "rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevaCategoriaForm({ siguienteOrden }: { siguienteOrden: number }) {
  const [state, formAction] = useActionState(crearCategoria, {});
  useToastAccion(state, "Categoría creada.");

  return (
    <form
      action={formAction}
      className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4"
    >
      <input
        name="nombre"
        placeholder="Nombre (ej: Rústico)"
        required
        className={inputClass}
      />
      <input
        name="slug"
        placeholder="Slug (opcional, se genera solo)"
        className={inputClass}
      />
      <input
        type="number"
        name="orden"
        placeholder="Orden"
        defaultValue={siguienteOrden}
        className={inputClass}
      />
      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Agregar categoría
      </button>
    </form>
  );
}
