"use client";

import { useActionState } from "react";
import { actualizarCliente } from "../actions";
import { useToastAccion } from "@/components/admin/ui/Toast";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function EditarClienteForm({
  clienteId,
  nombre,
  telefono,
  notas,
}: {
  clienteId: string;
  nombre: string;
  telefono: string;
  notas: string;
}) {
  const [state, formAction, pending] = useActionState(
    actualizarCliente.bind(null, clienteId),
    {}
  );
  useToastAccion(state, "Cliente actualizado.");

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-sm text-neutral-700">
        Nombre
        <input
          name="nombre"
          defaultValue={nombre}
          required
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-sm text-neutral-700">
        Teléfono
        <input
          name="telefono"
          defaultValue={telefono}
          required
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-sm text-neutral-700 sm:col-span-2">
        Notas
        <textarea
          name="notas"
          defaultValue={notas}
          rows={2}
          className={`${inputClass} mt-1`}
        />
      </label>
      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60 sm:w-fit"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
