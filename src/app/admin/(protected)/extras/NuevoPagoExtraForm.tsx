"use client";

import { useActionState, useMemo, useState } from "react";
import { registrarPagoExtra } from "./actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

type TipoOpcion = { id: string; descripcion: string; montoSugerido: string | null };

export function NuevoPagoExtraForm({
  empleados,
  tipos,
}: {
  empleados: { id: string; nombre: string }[];
  tipos: TipoOpcion[];
}) {
  const [state, formAction, pending] = useActionState(registrarPagoExtra, {});
  const [empleadoId, setEmpleadoId] = useState("");
  const [tipoPagoExtraId, setTipoPagoExtraId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");

  const opcionesEmpleado = useMemo(
    () => empleados.map((e) => ({ id: e.id, etiqueta: e.nombre })),
    [empleados]
  );

  function elegirTipo(id: string) {
    setTipoPagoExtraId(id);
    const tipo = tipos.find((t) => t.id === id);
    if (tipo) {
      setDescripcion(tipo.descripcion);
      if (tipo.montoSugerido) setMonto(tipo.montoSugerido);
    }
  }

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
        Tipo (opcional)
        <select
          value={tipoPagoExtraId}
          onChange={(evento) => elegirTipo(evento.target.value)}
          className={`${inputClass} mt-1`}
        >
          <option value="">Otro (escribir a mano)</option>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.descripcion}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-neutral-500">
        Descripción
        <input
          name="descripcion"
          required
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        Monto
        <input
          type="number"
          name="monto"
          min="0"
          step="0.01"
          required
          value={monto}
          onChange={(evento) => setMonto(evento.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500 sm:col-span-2">
        Notas (opcional)
        <textarea name="notas" rows={2} className={`${inputClass} mt-1`} />
      </label>

      <input type="hidden" name="empleadoId" value={empleadoId} />
      <input type="hidden" name="tipoPagoExtraId" value={tipoPagoExtraId} />

      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !empleadoId}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {pending ? "Guardando…" : "Registrar pago extra"}
      </button>
    </form>
  );
}
