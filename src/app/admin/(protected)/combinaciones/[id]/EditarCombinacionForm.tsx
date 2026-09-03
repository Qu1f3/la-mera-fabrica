"use client";

import { useActionState, useState } from "react";
import { actualizarCombinacion } from "../actions";
import { ComponentesEditor } from "../ComponentesEditor";
import { componenteVacio, type ComponenteFormulario } from "../tipos";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

function nuevaKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function EditarCombinacionForm({
  combinacionId,
  notasIniciales,
  componentesIniciales,
}: {
  combinacionId: string;
  notasIniciales: string;
  componentesIniciales: ComponenteFormulario[];
}) {
  const [state, formAction, pending] = useActionState(
    actualizarCombinacion.bind(null, combinacionId),
    {}
  );
  const [componentes, setComponentes] = useState<ComponenteFormulario[]>(
    componentesIniciales.length > 0 ? componentesIniciales : [componenteVacio(nuevaKey())]
  );

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3">
      {/* El mosaico ligado a esta combinación no se puede cambiar acá -- si
          es el mosaico equivocado, se borra esta combinación y se crea una
          nueva para el correcto (ver actions.ts::actualizarCombinacion). */}
      <ComponentesEditor componentes={componentes} onChange={setComponentes} generarKey={nuevaKey} />

      <label className="text-xs text-neutral-500">
        Nota general de la combinación (opcional)
        <textarea
          name="notas"
          defaultValue={notasIniciales}
          rows={2}
          className={`${inputClass} mt-1`}
        />
      </label>

      <input type="hidden" name="componentesJson" value={JSON.stringify(componentes)} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:w-fit"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
