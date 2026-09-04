"use client";

import { useActionState, useMemo, useState } from "react";
import { crearExistencia } from "../actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevaExistenciaForm({
  productos,
}: {
  productos: { id: string; nombre: string; sku: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(crearExistencia, {});
  const [productoId, setProductoId] = useState("");

  const opcionesProducto = useMemo(
    () =>
      productos.map((p) => ({
        id: p.id,
        etiqueta: p.sku ? `${p.nombre} (${p.sku})` : p.nombre,
      })),
    [productos]
  );

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3">
      <label className="text-xs text-neutral-500">
        ¿Qué mosaico es?
        <Combobox
          opciones={opcionesProducto}
          valorId={productoId}
          onSeleccionar={setProductoId}
          placeholder="Escribe para buscar…"
          className={`${inputClass} mt-1`}
        />
      </label>

      <label className="text-xs text-neutral-500">
        Cantidad en bodega
        <input
          type="number"
          name="cantidad"
          min="0"
          step="1"
          placeholder="Ej: 24"
          className={`${inputClass} mt-1`}
        />
      </label>

      <label className="text-xs text-neutral-500">
        Nota (opcional)
        <input name="notas" className={`${inputClass} mt-1`} />
      </label>

      <input type="hidden" name="productoId" value={productoId} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !productoId}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:w-fit"
      >
        {pending ? "Guardando…" : "Registrar existencia"}
      </button>
    </form>
  );
}
