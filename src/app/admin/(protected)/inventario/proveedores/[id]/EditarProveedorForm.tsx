"use client";

import { useActionState } from "react";
import { actualizarProveedor } from "../../actions";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function EditarProveedorForm({
  proveedorId,
  nombre,
  telefono,
  notas,
}: {
  proveedorId: string;
  nombre: string;
  telefono: string;
  notas: string;
}) {
  const [state, formAction, pending] = useActionState(
    actualizarProveedor.bind(null, proveedorId),
    {}
  );

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-neutral-500">
        Nombre
        <input
          name="nombre"
          defaultValue={nombre}
          required
          className={`${inputClass} mt-1 w-full`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Teléfono
        <input
          name="telefono"
          defaultValue={telefono}
          className={`${inputClass} mt-1 w-full`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Notas
        <textarea
          name="notas"
          defaultValue={notas}
          rows={2}
          className={`${inputClass} mt-1 w-full`}
        />
      </label>
      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60 sm:w-fit"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
