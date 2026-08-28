"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { crearMaterial } from "./actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

/**
 * Formulario de material, pensado para vivir dentro de un Modal (ver
 * InventarioPanel.tsx). Solo pide lo esencial de entrada (nombre, unidad,
 * mínimo) -- proveedor/conversión de unidad quedan escondidos detrás de
 * "+ Más opciones" para no abrumar cuando lo único que se necesita es dar
 * de alta un material rápido. NO pide costo: eso se pediría dos veces (acá
 * y de nuevo al registrar la primera entrada) -- el costo del material se
 * sincroniza solo desde ahí (ver registrarMovimiento en actions.ts).
 */
export function NuevoMaterialForm({
  proveedores,
  onSuccess,
}: {
  proveedores: { id: string; nombre: string }[];
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(crearMaterial, {});
  const [proveedorId, setProveedorId] = useState("");
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [state.ok, onSuccess]);

  const opcionesProveedor = useMemo(
    () => proveedores.map((p) => ({ id: p.id, etiqueta: p.nombre })),
    [proveedores]
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3">
      <label className="text-xs text-neutral-500">
        Nombre
        <input name="nombre" required autoFocus className={`${inputClass} mt-1`} />
      </label>
      <label className="text-xs text-neutral-500">
        Unidad de medida
        <input
          name="unidadMedida"
          placeholder="Ej: kg, litros, unidades"
          required
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        ¿Avisarte cuando quede poco stock? (opcional)
        <input
          type="number"
          name="cantidadMinima"
          min="0"
          step="0.01"
          placeholder="Cantidad mínima"
          className={`${inputClass} mt-1`}
        />
      </label>

      <button
        type="button"
        onClick={() => setMostrarAvanzado((v) => !v)}
        className="w-fit text-xs font-medium text-neutral-500 hover:text-neutral-800"
      >
        {mostrarAvanzado
          ? "− Menos opciones"
          : "+ Más opciones (proveedor, conversión de unidad)"}
      </button>

      {mostrarAvanzado && (
        <div className="grid grid-cols-1 gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
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
            <span className="mt-1 block text-neutral-400">
              Ej: si compras cemento en bolsas de 42.5 kg, la unidad de medida
              es &quot;kg&quot; y esto es 42.5. Si compras y usas la misma
              unidad, déjalo en 1.
            </span>
          </label>
          <label className="text-xs text-neutral-500">
            Proveedor
            <Combobox
              opciones={opcionesProveedor}
              valorId={proveedorId}
              onSeleccionar={setProveedorId}
              placeholder="Escribe para buscar…"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-xs text-neutral-500">
            Notas
            <textarea name="notas" rows={2} className={`${inputClass} mt-1`} />
          </label>
        </div>
      )}

      <input type="hidden" name="proveedorId" value={proveedorId} />

      <p className="text-xs text-neutral-500">
        La cantidad actual empieza en 0 y el costo queda vacío -- ambos se
        cargan solos al registrar la primera entrada de este material.
      </p>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Crear material"}
      </button>
    </form>
  );
}
