"use client";

import { useActionState, useMemo, useState } from "react";
import { actualizarMaterial } from "../actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function EditarMaterialForm({
  materialId,
  nombre,
  unidadMedida,
  cantidadPorUnidad,
  cantidadMinima,
  costo,
  proveedorIdInicial,
  notas,
  proveedores,
}: {
  materialId: string;
  nombre: string;
  unidadMedida: string;
  cantidadPorUnidad: string;
  cantidadMinima: string;
  costo: string;
  proveedorIdInicial: string;
  notas: string;
  proveedores: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    actualizarMaterial.bind(null, materialId),
    {}
  );
  const [proveedorId, setProveedorId] = useState(proveedorIdInicial);

  const opcionesProveedor = useMemo(
    () => proveedores.map((p) => ({ id: p.id, etiqueta: p.nombre })),
    [proveedores]
  );

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-neutral-500">
        Nombre
        <input
          name="nombre"
          defaultValue={nombre}
          required
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Unidad de medida
        <input
          name="unidadMedida"
          defaultValue={unidadMedida}
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
          defaultValue={cantidadPorUnidad}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Cantidad mínima (en la unidad de medida)
        <input
          type="number"
          name="cantidadMinima"
          min="0"
          step="0.01"
          defaultValue={cantidadMinima}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Costo por unidad
        <input
          type="number"
          name="costo"
          min="0"
          step="0.01"
          defaultValue={costo}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Proveedor
        <Combobox
          opciones={opcionesProveedor}
          valorId={proveedorId}
          onSeleccionar={setProveedorId}
          placeholder="Escribe para buscar…"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Notas
        <textarea
          name="notas"
          defaultValue={notas}
          rows={2}
          className={`${inputClass} mt-1`}
        />
      </label>

      <input type="hidden" name="proveedorId" value={proveedorId} />

      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60 sm:col-span-2 sm:w-fit"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
