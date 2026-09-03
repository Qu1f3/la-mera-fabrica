"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/admin/ui/Toast";
import { Combobox } from "@/components/admin/ui/Combobox";
import { encolarExtra, generarIdLocal } from "@/lib/offline/sync";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

// Valor especial para "seleccion" cuando el trabajo no coincide con ninguno
// de los tipos ya definidos -- distinto de "" (todavía no elige nada), así
// el botón "Otro" también se puede marcar como seleccionado visualmente.
const OTRO = "__OTRO__";

type TipoOpcion = {
  id: string;
  descripcion: string;
  montoSugerido: string | null;
  signo: "SUMA" | "RESTA";
};

/**
 * Formulario simplificado para registrar un pago extra -- pensado para que
 * lo use alguien sin experiencia con el panel (ej. un EMPLEADO como rol,
 * no necesariamente el dueño): en vez de un <select> con texto técnico
 * ("Otro (escribir a mano)") y un campo de Descripción separado que hay que
 * llenar aparte, los tipos ya definidos aparecen como botones grandes para
 * tocar. Al elegir uno, la Descripción se llena sola y no se vuelve a
 * mostrar -- solo se pide el Monto. Solo si el trabajo no calza con ningún
 * tipo (botón "Otro") se pide escribir de qué se trató.
 *
 * Desde la Fase 2 de "modo sin conexión" (ver propuesta-modo-offline.md)
 * ya no manda a una Server Action -- guarda con encolarExtra(), que
 * funciona igual con o sin señal, y el signo (suma/resta) se aplica acá
 * mismo antes de guardar (el navegador ya lo sabe, es lo mismo dato que
 * pinta los botones en rojo) en vez de que el servidor tenga que ir a
 * buscarlo a la base -- así no hace falta estar en línea para saber si un
 * "Préstamo" resta.
 */
export function NuevoPagoExtraForm({
  empleados,
  tipos,
}: {
  empleados: { id: string; nombre: string }[];
  tipos: TipoOpcion[];
}) {
  const { mostrarToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [empleadoId, setEmpleadoId] = useState("");
  const [seleccion, setSeleccion] = useState(""); // "" | OTRO | id de un TipoPagoExtra
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [mostrarNotas, setMostrarNotas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
  const tipoSeleccionado = tipos.find((t) => t.id === seleccion);
  const esResta = tipoSeleccionado?.signo === "RESTA";

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const montoNum = Number(monto);
    const descripcionFinal = descripcion.trim();
    const notas = String(new FormData(evento.currentTarget).get("notas") || "").trim() || null;

    if (!empleadoId) {
      setError("Selecciona un empleado.");
      return;
    }
    if (!descripcionFinal) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (!Number.isFinite(montoNum) || montoNum < 0) {
      setError("El monto no es válido.");
      return;
    }

    const montoFinal = esResta ? -montoNum : montoNum;

    setPending(true);
    try {
      await encolarExtra({
        id: generarIdLocal(),
        empleadoId,
        tipoPagoExtraId: tipoPagoExtraId || null,
        descripcion: descripcionFinal,
        monto: montoFinal,
        notas,
      });
      mostrarToast("Pago extra registrado.");
      // Se limpia todo el formulario -- si los campos se quedan llenos con
      // el último pago, mi mamá no está segura de que se guardó y le da
      // doble click a "Registrar pago extra".
      setEmpleadoId("");
      setSeleccion("");
      setDescripcion("");
      setMonto("");
      setMostrarNotas(false);
      formRef.current?.reset();
    } catch {
      setError("No se pudo guardar en este dispositivo. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={alEnviar} className="mt-3 space-y-4">
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
                  ? tipo.signo === "RESTA"
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-neutral-900 bg-neutral-900 text-white"
                  : tipo.signo === "RESTA"
                    ? "border-red-300 text-red-700 hover:bg-red-50"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {tipo.descripcion}
              {tipo.signo === "RESTA" && " (resta)"}
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
          {esResta ? "¿Cuánto se le resta?" : "¿Cuánto se le paga?"} (L.)
          <input
            type="number"
            name="monto"
            min="0"
            step="0.01"
            required
            value={monto}
            onChange={(evento) => setMonto(evento.target.value)}
            className={`${inputClass} mt-1 ${esResta ? "border-red-300" : ""}`}
          />
          {esResta && (
            <span className="mt-1 block text-red-600">
              Esto se restará del pago semanal del empleado.
            </span>
          )}
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

      {error && <p className="text-sm text-red-600">{error}</p>}

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
