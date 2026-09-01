"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { actualizarNosotros } from "./actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";
const labelClass = "text-sm font-medium text-neutral-700";

export function NosotrosForm({
  titulo,
  cuerpo,
}: {
  titulo: string;
  cuerpo: string;
}) {
  const [state, formAction] = useActionState(actualizarNosotros, {});
  useToastAccion(state, "Texto guardado.");

  return (
    <form
      action={formAction}
      className="mt-6 space-y-5 rounded-lg border border-neutral-200 bg-white p-6"
    >
      <div className="space-y-1">
        <label htmlFor="titulo" className={labelClass}>
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          defaultValue={titulo}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="cuerpo" className={labelClass}>
          Texto
        </label>
        <textarea
          id="cuerpo"
          name="cuerpo"
          rows={8}
          defaultValue={cuerpo}
          placeholder="La historia real del negocio: cómo empezó, quiénes lo forman, qué los distingue..."
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Guardar
      </button>
    </form>
  );
}
