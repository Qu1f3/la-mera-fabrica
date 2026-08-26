"use client";

import { useActionState, useMemo, useState } from "react";
import { registrarProduccion } from "../actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevoRegistroProduccionForm({
  empleados,
  productos,
  montoMezclaDefault,
}: {
  empleados: { id: string; nombre: string }[];
  productos: { id: string; nombre: string; sku: string | null }[];
  montoMezclaDefault: string;
}) {
  const [state, formAction, pending] = useActionState(registrarProduccion, {});
  const [empleadoId, setEmpleadoId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [hizoMezcla, setHizoMezcla] = useState(false);

  const opcionesEmpleado = useMemo(
    () => empleados.map((e) => ({ id: e.id, etiqueta: e.nombre })),
    [empleados]
  );
  const opcionesProducto = useMemo(
    () =>
      productos.map((p) => ({
        id: p.id,
        etiqueta: p.sku ? `${p.nombre} (${p.sku})` : p.nombre,
      })),
    [productos]
  );

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-neutral-500">
        Empleado
        <Combobox
          opciones={opcionesEmpleado}
          valorId={empleadoId}
          onSeleccionar={setEmpleadoId}
          placeholder="Escribe para buscar…"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Producto
        <Combobox
          opciones={opcionesProducto}
          valorId={productoId}
          onSeleccionar={setProductoId}
          placeholder="Escribe para buscar…"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Cantidad producida{!productoId && " (si va a registrar producción)"}
        <input
          type="number"
          name="cantidadProducida"
          min="1"
          step="1"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Unidades defectuosas (opcional)
        <input
          type="number"
          name="unidadesDefectuosas"
          min="0"
          step="1"
          defaultValue="0"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Notas (opcional)
        <textarea name="notas" rows={2} className={`${inputClass} mt-1`} />
      </label>

      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            name="hizoMezcla"
            checked={hizoMezcla}
            onChange={(e) => setHizoMezcla(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          También hizo mezcla hoy
        </label>
        {hizoMezcla && (
          <label className="mt-2 block text-xs text-neutral-500">
            Monto de mezcla
            <input
              type="number"
              name="montoMezcla"
              min="0"
              step="0.01"
              defaultValue={montoMezclaDefault}
              className={`${inputClass} mt-1 sm:w-40`}
            />
          </label>
        )}
      </div>

      <input type="hidden" name="empleadoId" value={empleadoId} />
      <input type="hidden" name="productoId" value={productoId} />

      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !empleadoId || (!productoId && !hizoMezcla)}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {pending ? "Guardando…" : "Registrar"}
      </button>
    </form>
  );
}
