"use client";

import { useState } from "react";
import type { TipoProducto } from "@/lib/types";
import { MOSAICOS_POR_M2, piezasDeMosaico } from "@/lib/cobertura";

type Fila = { largo: string; ancho: string };

const MERMA_SUGERIDA = "10";

/**
 * Ayuda al cliente a calcular cuántos m²/ml necesita a partir de las
 * medidas reales del espacio, en vez de dejarlo adivinar un número — nace
 * directamente de la objeción que motivó "cantidad opcional" en la Fase 3
 * ("un cliente no sabe cuántos metros cuadrados tiene").
 *
 * Es "unificada" (ver Fase 0, decisión 5): un solo componente que se adapta
 * según el tipo de producto — para mosaico suma áreas (largo × ancho de
 * cada sección, útil para espacios en L), para moldura suma longitudes
 * (cada tramo o pared). No depende de que el producto tenga cargadas
 * especificaciones técnicas (cobertura por caja, etc.) — funciona igual
 * para cualquier producto del catálogo.
 */
export function CalculadoraCobertura({
  tipo,
  onUsar,
}: {
  tipo: TipoProducto;
  onUsar: (total: number) => void;
}) {
  // El usuario pidió que la calculadora tuviera "más protagonismo" — pasó de
  // un botón chico que había que abrir, a un bloque abierto de entrada (el
  // cliente la ve sin tener que descubrirla primero). Sigue pudiendo
  // ocultarla si no la necesita (botón "Ocultar" dentro del bloque).
  const [abierta, setAbierta] = useState(true);
  const [filas, setFilas] = useState<Fila[]>([{ largo: "", ancho: "" }]);
  const [merma, setMerma] = useState(MERMA_SUGERIDA);

  const esMosaico = tipo === "MOSAICO";
  // "ml" (metro lineal) es un término de construcción que no todo cliente
  // conoce — se escribe completo la primera vez que aparece en la pantalla
  // (el título/disparador de la calculadora), y se deja abreviado en el
  // resto del bloque una vez que ya quedó explicado ahí arriba.
  const etiquetaUnidadLarga = esMosaico ? "m²" : "ml (metros lineales)";

  const total = filas.reduce((suma, fila) => {
    const largo = Number(fila.largo);
    if (!Number.isFinite(largo) || largo <= 0) return suma;
    if (esMosaico) {
      const ancho = Number(fila.ancho);
      if (!Number.isFinite(ancho) || ancho <= 0) return suma;
      return suma + largo * ancho;
    }
    return suma + largo;
  }, 0);

  const mermaNumero = Number(merma);
  const factorMerma =
    Number.isFinite(mermaNumero) && mermaNumero > 0 ? mermaNumero / 100 : 0;
  const totalConMerma = total * (1 + factorMerma);
  // Redondeado hacia arriba al siguiente 0.5, para que combine con el step
  // de los campos de cantidad del resto del sitio.
  const totalRedondeado = Math.ceil(totalConMerma * 2) / 2;
  // Cuántas piezas de mosaico comprar, no solo cuántos m² — muchos clientes
  // no saben convertir uno al otro. Solo aplica a mosaico: una moldura se
  // vende por longitud (ml), no por pieza sobre un área.
  const unidadesEstimadas =
    esMosaico && totalRedondeado > 0
      ? piezasDeMosaico(totalRedondeado)
      : null;

  function actualizarFila(indice: number, campo: keyof Fila, valor: string) {
    setFilas((previas) =>
      previas.map((fila, i) =>
        i === indice ? { ...fila, [campo]: valor } : fila
      )
    );
  }

  function agregarFila() {
    setFilas((previas) => [...previas, { largo: "", ancho: "" }]);
  }

  function quitarFila(indice: number) {
    setFilas((previas) => previas.filter((_, i) => i !== indice));
  }

  if (!abierta) {
    // Solo se llega aquí si el cliente la ocultó a propósito (ver estado
    // inicial arriba, ahora abierta por defecto). Se deja un disparador
    // igual de visible que antes para volver a mostrarla.
    return (
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-terracota/40 bg-terracota/5 px-3 py-2 text-sm font-medium text-terracota hover:bg-terracota/10 sm:w-auto"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="9" y2="11.01" />
          <line x1="12" y1="11" x2="12" y2="11.01" />
          <line x1="15" y1="11" x2="15" y2="11.01" />
          <line x1="9" y1="14" x2="9" y2="14.01" />
          <line x1="12" y1="14" x2="12" y2="14.01" />
          <line x1="15" y1="14" x2="15" y2="14.01" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
        No sé cuántos {etiquetaUnidadLarga} necesito — calcularlo con las
        medidas de mi espacio
      </button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-terracota/30 bg-terracota/5 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 shrink-0 text-terracota"
            aria-hidden="true"
          >
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <line x1="9" y1="7" x2="15" y2="7" />
            <line x1="9" y1="11" x2="9" y2="11.01" />
            <line x1="12" y1="11" x2="12" y2="11.01" />
            <line x1="15" y1="11" x2="15" y2="11.01" />
            <line x1="9" y1="14" x2="9" y2="14.01" />
            <line x1="12" y1="14" x2="12" y2="14.01" />
            <line x1="15" y1="14" x2="15" y2="14.01" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
          <h2 className="text-base font-semibold text-carbon sm:text-lg">
            ¿No sabes cuántos {etiquetaUnidadLarga} necesitas? Calcúlalo aquí
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setAbierta(false)}
          className="shrink-0 text-sm text-piedra hover:underline"
        >
          Ocultar
        </button>
      </div>

      <p className="mt-1 text-sm font-medium text-piedra">
        {esMosaico
          ? "Mide cada sección del área a cubrir (en metros)"
          : "Mide cada tramo o pared donde va la moldura (en metros)"}
      </p>

      <div className="mt-3 space-y-2">
        {filas.map((fila, indice) => (
          <div key={indice} className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={0.01}
              value={fila.largo}
              onChange={(evento) =>
                actualizarFila(indice, "largo", evento.target.value)
              }
              placeholder={esMosaico ? "Largo" : "Longitud"}
              className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
              aria-label={
                esMosaico
                  ? `Largo de la sección ${indice + 1} (metros)`
                  : `Longitud del tramo ${indice + 1} (metros)`
              }
            />
            {esMosaico && (
              <>
                <span className="text-sm text-piedra">×</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={fila.ancho}
                  onChange={(evento) =>
                    actualizarFila(indice, "ancho", evento.target.value)
                  }
                  placeholder="Ancho"
                  className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
                  aria-label={`Ancho de la sección ${indice + 1} (metros)`}
                />
              </>
            )}
            <span className="text-sm text-piedra">m</span>
            {filas.length > 1 && (
              <button
                type="button"
                onClick={() => quitarFila(indice)}
                className="ml-auto text-sm text-red-600 hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={agregarFila}
        className="mt-2 text-sm font-medium text-terracota hover:underline"
      >
        + Agregar {esMosaico ? "otra sección" : "otro tramo"}
      </button>

      <div className="mt-3 flex items-center gap-2">
        <label className="text-sm text-piedra" htmlFor="merma-calculadora">
          Margen para cortes/roturas
        </label>
        <input
          id="merma-calculadora"
          type="number"
          min={0}
          max={50}
          step={1}
          value={merma}
          onChange={(evento) => setMerma(evento.target.value)}
          className="w-14 rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-neutral-900"
        />
        <span className="text-sm text-piedra">%</span>
      </div>

      {/*
        El total es el resultado que el cliente busca al abrir esto — se le
        da su propia tarjeta blanca dentro del bloque (en vez de un párrafo
        más) para que resalte del resto del formulario.
      */}
      <div className="mt-3 rounded-md bg-white p-3">
        <p className="text-sm text-piedra">Total estimado</p>
        <p className="text-xl font-bold text-terracota sm:text-2xl">
          {totalRedondeado > 0
            ? `${totalRedondeado} ${esMosaico ? "m²" : "ml"}`
            : "—"}
        </p>
        {total > 0 && (
          <p className="mt-0.5 text-sm text-piedra">
            {total.toFixed(2)} {esMosaico ? "m²" : "ml"} + {merma || 0}% de
            margen
          </p>
        )}
        {unidadesEstimadas !== null && (
          <p className="mt-1 text-sm text-piedra">
            Eso son aproximadamente{" "}
            <span className="font-semibold text-carbon">
              {unidadesEstimadas} mosaicos
            </span>{" "}
            (a {MOSAICOS_POR_M2} piezas por m²).
          </p>
        )}
      </div>

      <div className="mt-3">
        <button
          type="button"
          disabled={totalRedondeado <= 0}
          onClick={() => {
            onUsar(totalRedondeado);
          }}
          className="w-full rounded-md bg-terracota px-4 py-2.5 text-sm font-semibold text-white hover:bg-terracota-dark disabled:opacity-50 sm:w-auto"
        >
          Usar este cálculo
        </button>
      </div>
    </div>
  );
}
