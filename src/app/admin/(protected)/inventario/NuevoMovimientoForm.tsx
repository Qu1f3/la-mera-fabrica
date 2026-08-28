"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { registrarMovimiento } from "./actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

type MaterialOpcion = {
  id: string;
  nombre: string;
  unidadMedida: string;
  cantidadPorUnidad: string;
  cantidadActual: string;
};

/**
 * Formulario de movimiento, pensado para vivir dentro de un Modal (ver
 * InventarioPanel.tsx). Si se abre desde el botón "+ Movimiento" de una
 * tarjeta de material puntual, `materialIdInicial` ya viene con ese
 * material y el formulario se salta el paso de buscarlo (no muestra el
 * Combobox, solo un rótulo) -- eso es lo que hace que registrar algo tome
 * un clic y escribir la cantidad, en vez de navegar a otra página y volver
 * a elegir el material.
 */
export function NuevoMovimientoForm({
  materiales,
  proveedores,
  materialIdInicial,
  onSuccess,
}: {
  materiales: MaterialOpcion[];
  proveedores: { id: string; nombre: string }[];
  materialIdInicial?: string | null;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(registrarMovimiento, {});
  const [materialId, setMaterialId] = useState(materialIdInicial ?? "");
  const [tipo, setTipo] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [esCompra, setEsCompra] = useState(false);
  const [esCredito, setEsCredito] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [costo, setCosto] = useState("");
  const [mostrarNotas, setMostrarNotas] = useState(false);

  useEffect(() => {
    if (state.ok) onSuccess?.();
  }, [state.ok, onSuccess]);

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
    Number(cantidad) > 0 && Number(costo) > 0 ? Number(cantidad) * Number(costo) : 0;

  function elegirTipo(nuevoTipo: "ENTRADA" | "SALIDA") {
    setTipo(nuevoTipo);
    // El costo y "fue una compra" solo aplican a una entrada -- una salida
    // es material que se llevó del almacén, no algo que se compró.
    if (nuevoTipo === "SALIDA") {
      setEsCompra(false);
      setEsCredito(false);
      setCosto("");
    }
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3">
      {materialIdInicial && materialSeleccionado ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
          <span className="text-neutral-500">Material: </span>
          <span className="font-medium text-neutral-900">
            {materialSeleccionado.nombre}
          </span>
          <span className="text-neutral-500">
            {" "}
            — stock actual: {materialSeleccionado.cantidadActual}{" "}
            {materialSeleccionado.unidadMedida}
          </span>
        </div>
      ) : (
        <label className="text-xs text-neutral-500">
          Material
          <Combobox
            opciones={opcionesMaterial}
            valorId={materialId}
            onSeleccionar={setMaterialId}
            placeholder="Escribe para buscar…"
            className={`${inputClass} mt-1`}
          />
        </label>
      )}

      <div>
        <p className="text-xs text-neutral-500">Tipo</p>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => elegirTipo("ENTRADA")}
            className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium ${
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
            className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium ${
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
          autoFocus={Boolean(materialIdInicial)}
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
      {tipo === "ENTRADA" && (
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
      )}
      {mostrarNotas ? (
        <label className="text-xs text-neutral-500">
          Notas (opcional)
          <textarea name="notas" rows={2} className={`${inputClass} mt-1`} />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setMostrarNotas(true)}
          className="text-left text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:underline"
        >
          + Agregar una nota (opcional)
        </button>
      )}

      {tipo === "ENTRADA" && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
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
            <div className="mt-2 grid grid-cols-1 gap-3">
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
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  name="esCredito"
                  checked={esCredito}
                  onChange={(e) => setEsCredito(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Es a crédito (se paga después)
              </label>
              {esCredito && (
                <p className="text-xs text-neutral-500">
                  No se registrará el gasto todavía. Cuando la pagues, márcala como
                  pagada desde la lista de compras pendientes en esta misma página.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <input type="hidden" name="materialId" value={materialId} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="proveedorId" value={esCompra ? proveedorId : ""} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={
          pending || !materialId || (esCompra && (!proveedorId || !(Number(costo) > 0)))
        }
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Registrar movimiento"}
      </button>
    </form>
  );
}
