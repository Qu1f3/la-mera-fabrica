"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { ETIQUETA_ESTADO_COTIZACION } from "@/lib/types";
import type { EstadoCotizacion } from "@/lib/types";
import { actualizarEstadoCotizacion } from "./actions";

export function EstadoCotizacionForm({
  id,
  estadoActual,
}: {
  id: string;
  estadoActual: EstadoCotizacion;
}) {
  const [state, formAction] = useActionState(
    actualizarEstadoCotizacion.bind(null, id),
    {}
  );
  useToastAccion(state, "Estado actualizado.");

  return (
    <form action={formAction} className="mt-2 flex items-center gap-2">
      <select
        name="estado"
        defaultValue={estadoActual}
        className="rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900"
      >
        {(Object.keys(ETIQUETA_ESTADO_COTIZACION) as EstadoCotizacion[]).map(
          (estado) => (
            <option key={estado} value={estado}>
              {ETIQUETA_ESTADO_COTIZACION[estado]}
            </option>
          )
        )}
      </select>
      <button
        type="submit"
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
      >
        Guardar
      </button>
    </form>
  );
}
