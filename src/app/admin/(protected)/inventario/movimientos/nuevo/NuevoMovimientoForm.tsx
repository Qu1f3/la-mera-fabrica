"use client";

import { useActionState, useMemo, useState } from "react";
import { registrarMovimiento } from "../../actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export function NuevoMovimientoForm({
  materiales,
  proveedores,
}: {
  materiales: {
    id: string;
    nombre: string;
    unidadMedida: string;
    cantidadPorUnidad: string;
    cantidadActual: string;
  }[];
  proveedores: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(registrarMovimiento, {});
  const [materialId, setMaterialId] = useState("");
  const [tipo, setTipo] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [esCompra, setEsCompra] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState("");

  const opcionesMaterial = useMemo(
    () =>
      materiales.map((m) => ({
        id: m.id,
        etiqueta: m.nombre,
        subtexto: `stock: ${m.cantidadActual} ${m.unidadMedida}`,
      })),
    [materiales]
  );
  const opcionesProveedor = useMemo(
    () => proveedores.map((p) => ({ id: p.id, etiqueta: p.nombre })),
    [proveedores]
  );

  const materialSeleccionado = materiales.find((m) => m.id === materialId) ?? null;
  const factorConversion = materialSeleccionado
    ? Number(materialSeleccionado.cantidadPorUnidad)
    : 1;
  const usaConversion = materialSeleccionado !== null && factorConversion !== 1;

  const etiquetaCantidad = usaConversion
    ? `Cantidad (unidades de ${materialSeleccionado!.cantidadPorUnidad} ${materialSeleccionado!.unidadMedida} cada una)`
    : materialSeleccionado
      ? `Cantidad (${materialSeleccionado.unidadMedida})`
      : "Cantidad";

  const cantidadEnUnidadBase =
    materialSeleccionado && Number(cantidad) > 0
      ? Number(cantidad) * factorConversion
      : null;

  const montoCalculado =
    Number(cantidad) > 0 && Number(costo) > 0
      ? Number(cantidad) * Number(costo)
      : 0;

  function elegirTipo(nuevoTipo: "ENTRADA" | "SALIDA") {
    setTipo(nuevoTipo);
    if (nuevoTipo === "SALIDA") setEsCompra(false);
  }

  return (
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Material
        <Combobox
          opciones={opcionesMaterial}
          valorId={materialId}
          onSeleccionar={setMaterialId}
          placeholder="Escribe para buscar…"
          className={`${inputClass} mt-1`}
        />
      </label>

      <div className="sm:col-span-2">
        <p className="text-xs text-neutral-500">Tipo</p>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => elegirTipo("ENTRADA")}
            className={`rounded-md border px-4 py-2 text-sm font-medium ${
              tipo === "ENTRADA"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => elegirTipo("SALIDA")}
            className={`rounded-md border px-4 py-2 text-sm font-medium ${
              tipo === "SALIDA"
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            Salida
          </button>
        </div>
      </div>

      <label className="text-xs text-neutral-500">
        {etiquetaCantidad}
        <input
          type="number"
          name="cantidad"
          min="0.01"
          step="0.01"
          required
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={`${inputClass} mt-1`}
        />
        {usaConversion && cantidadEnUnidadBase !== null && (
          <span className="mt-1 block text-neutral-400">
            = {cantidadEnUnidadBase.toFixed(2)} {materialSeleccionado!.unidadMedida}
          </span>
        )}
      </label>
      <label className="text-xs text-neutral-500">
        Costo por unidad de compra (opcional)
        <input
          type="number"
          name="costo"
          min="0"
          step="0.01"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Notas (opcional)
        <textarea name="notas" rows={2} className={`${inputClass} mt-1`} />
      </label>

      {tipo === "ENTRADA" && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <input
              type="checkbox"
              name="esCompra"
              checked={esCompra}
              onChange={(e) => setEsCompra(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Fue una compra a un proveedor
          </label>
          {esCompra && (
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div className="text-xs text-neutral-500">
                Monto total (calculado)
                <p className={`${inputClass} mt-1 bg-neutral-100 text-neutral-700`}>
                  L. {montoCalculado.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input type="hidden" name="materialId" value={materialId} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="proveedorId" value={esCompra ? proveedorId : ""} />

      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={
          pending ||
          !materialId ||
          (esCompra && (!proveedorId || !(Number(costo) > 0)))
        }
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {pending ? "Guardando…" : "Registrar movimiento"}
      </button>
    </form>
  );
}
