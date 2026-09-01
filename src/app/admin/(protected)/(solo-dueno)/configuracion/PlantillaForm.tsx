"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { actualizarPlantilla } from "./actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";
const labelClass = "text-sm font-medium text-neutral-700";

type Plantilla = {
  id: string;
  clave: string;
  nombre: string;
  cuerpo: string;
};

export function PlantillaForm({
  plantilla,
  variables,
}: {
  plantilla: Plantilla;
  variables: string[];
}) {
  const [state, formAction] = useActionState(
    actualizarPlantilla.bind(null, plantilla.clave),
    {}
  );
  useToastAccion(state, "Plantilla actualizada.");

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-lg border border-neutral-200 bg-white p-6"
    >
      <label htmlFor={`cuerpo-${plantilla.id}`} className={labelClass}>
        {plantilla.nombre}
      </label>
      <textarea
        id={`cuerpo-${plantilla.id}`}
        name="cuerpo"
        defaultValue={plantilla.cuerpo}
        rows={7}
        className={inputClass}
      />
      <p className="text-xs text-neutral-400">
        Variables disponibles: {variables.map((v) => `{{${v}}}`).join(", ")}
      </p>
      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Guardar plantilla
      </button>
    </form>
  );
}
