"use client";

import { useActionState, useMemo, useState } from "react";
import { registrarPagoExtra } from "./actions";
import { Combobox } from "@/components/admin/ui/Combobox";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

// Valor especial para "seleccion" cuando el trabajo no coincide con ninguno
// de los tipos ya definidos -- distinto de "" (todavía no elige nada), así
// el botón "Otro" también se puede marcar como seleccionado visualmente.
const OTRO = "__OTRO__";

type TipoOpcion = { id: string; descripcion: string; montoSugerido: string | null };

/**
 * Formulario simplificado para registrar un pago extra -- pensado para que
 * lo use alguien sin experiencia con el panel (ej. un EMPLEADO como rol,
 * no necesariamente el dueño): en vez de un <select> con texto técnico
 * ("Otro (escribir a mano)") y un campo de Descripción separado que hay que
 * llenar aparte, los tipos ya definidos aparecen como botones grandes para
 * tocar. Al elegir uno, la Descripción se llena sola y no se vuelve a
 * mostrar -- solo se pide el Monto. Solo si el trabajo no calza con ningún
 * tipo (botón "Otro") se pide escribir de qué se trató.
 */
export function NuevoPagoExtraForm({
  empleados,
  tipos,
}: {
  empleados: { id: string; nombre: string }[];
  tipos: TipoOpcion[];
}) {
  const [state, formAction, pending] = useActionState(registrarPagoExtra, {});
  const [empleadoId, setEmpleadoId] = useState("");
  const [seleccion, setSeleccion] = useState(""); // "" | OTRO | id de un TipoPagoExtra
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [mostrarNotas, setMostrarNotas] = useState(false);

  const opcionesEmpleado = useMemo(
    () => empleados.map((e) => ({ id: e.id, etiqueta: e.nombre })),
    [empleados]
  );

  function elegirTipo(tipo: TipoOpcion) {
    setSeleccion(tipo.id);
    setDescripcion(tipo.descripcion);
    setMonto(tipo.montoSugerido ?? "");
  }

  function elegirOtro() {
    setSeleccion(OTRO);
    setDescripcion("");
    setMonto("");
  }

  const esOtro = seleccion === OTRO;
  const tipoPagoExtraId = !esOtro ? seleccion : "";
  const faltaDescripcion = esOtro && descripcion.trim() === "";

  return (
    <form action={formAction} className="mt-3 space-y-4">
      <label className="block text-xs text-neutral-500">
        ¿Quién hizo el trabajo?
        <Combobox
          opciones={opcionesEmpleado}
          valorId={empleadoId}
          onSeleccionar={setEmpleadoId}
          placeholder="Escribe el nombre…"
          className={`${inputClass} mt-1`}
        />
      </label>

      <div>
        <p className="text-xs text-neutral-500">¿Qué tipo de trabajo fue?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tipos.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              onClick={() => elegirTipo(tipo)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                seleccion === tipo.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {tipo.descripcion}
            </button>
          ))}
          <button
            type="button"
            onClick={elegirOtro}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              esOtro
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            Otro
          </button>
        </div>
      </div>

      {esOtro && (
        <label className="block text-xs text-neutral-500">
          ¿En qué consistió el trabajo?
          <input
            name="descripcion"
            required
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            placeholder="Ej: ayudó a cargar el camión"
            className={`${inputClass} mt-1`}
          />
        </label>
      )}

      {seleccion !== "" && (
        <label className="block text-xs text-neutral-500 sm:w-48">
          ¿Cuánto se le paga? (L.)
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
      )}

      {mostrarNotas ? (
        <label className="block text-xs text-neutral-500">
          Notas (opcional)
          <textarea name="notas" rows={2} className={`${inputClass} mt-1`} />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setMostrarNotas(true)}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:underline"
        >
          + Agregar una nota (opcional)
        </button>
      )}

      <input type="hidden" name="empleadoId" value={empleadoId} />
      <input type="hidden" name="tipoPagoExtraId" value={tipoPagoExtraId} />
      {!esOtro && <input type="hidden" name="descripcion" value={descripcion} />}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !empleadoId || seleccion === "" || !monto || faltaDescripcion}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Registrar pago extra"}
      </button>
    </form>
  );
}
