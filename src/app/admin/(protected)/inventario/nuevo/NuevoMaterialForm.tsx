"use client";

import { useActionState, useMemo, useState } from "react";
import { crearMaterial } from "../actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevoMaterialForm({
  proveedores,
}: {
  proveedores: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(crearMaterial, {});
  const [proveedorId, setProveedorId] = useState("");

  const opcionesProveedor = useMemo(
    () => proveedores.map((p) => ({ id: p.id, etiqueta: p.nombre })),
    [proveedores]
  );

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-neutral-500">
        Nombre
        <input name="nombre" required className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-neutral-500">
        Unidad de medida
        <input
          name="unidadMedida"
          placeholder="Ej: kg, litros"
          required
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Cantidad por unidad de compra
        <input
          type="number"
          name="cantidadPorUnidad"
          min="0.01"
          step="0.01"
          defaultValue="1"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Cantidad mínima (opcional, en la unidad de medida)
        <input
          type="number"
          name="cantidadMinima"
          min="0"
          step="0.01"
          defaultValue="0"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Costo por unidad (opcional)
        <input
          type="number"
          name="costo"
          min="0"
          step="0.01"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Proveedor (opcional)
        <Combobox
          opciones={opcionesProveedor}
          valorId={proveedorId}
          onSeleccionar={setProveedorId}
          placeholder="Escribe para buscar…"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Notas (opcional)
        <textarea name="notas" rows={2} className={`${inputClass} mt-1`} />
      </label>

      <input type="hidden" name="proveedorId" value={proveedorId} />

      <p className="text-xs text-neutral-500 sm:col-span-2">
        Cuánto trae cada unidad de compra, en la unidad de medida. Ej: si
        compras cemento en bolsas de 42.5 kg, la unidad de medida es "kg" y
        la cantidad por unidad es 42.5. Si compras y usas la misma unidad
        (sin conversión), déjalo en 1.
      </p>
      <p className="text-xs text-neutral-500 sm:col-span-2">
        La cantidad actual empieza en 0 -- se carga después registrando un
        movimiento de entrada.
      </p>

      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {pending ? "Guardando…" : "Crear material"}
      </button>
    </form>
  );
}
