"use client";

import { useActionState } from "react";
import { crearProveedor } from "../actions";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevoProveedorForm() {
  const [state, formAction, pending] = useActionState(crearProveedor, {});

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <input name="nombre" placeholder="Nombre" required className={inputClass} />
      <input name="telefono" placeholder="Teléfono (opcional)" className={inputClass} />
      <input name="notas" placeholder="Notas (opcional)" className={inputClass} />
      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60 sm:col-span-3 sm:w-fit"
      >
        {pending ? "Guardando…" : "Agregar proveedor"}
      </button>
    </form>
  );
}
