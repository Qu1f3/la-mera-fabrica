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
  const [abierta, setAbierta] = useState(false);
  const [filas, setFilas] = useState<Fila[]>([{ largo: "", ancho: "" }]);
  const [merma, setMerma] = useState(MERMA_SUGERIDA);

  const esMosaico = tipo === "MOSAICO";

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
    return (
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="text-xs font-medium text-terracota underline decoration-dotted"
      >
        Calcúlalo con las medidas de tu espacio
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-neutral-200 bg-arena/40 p-3">
      <p className="text-xs font-medium text-carbon">
        {esMosaico
          ? "Mide cada sección del área a cubrir (en metros)"
          : "Mide cada tramo o pared donde va la moldura (en metros)"}
      </p>

      <div className="mt-2 space-y-2">
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
              className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-900"
              aria-label={
                esMosaico
                  ? `Largo de la sección ${indice + 1} (metros)`
                  : `Longitud del tramo ${indice + 1} (metros)`
              }
            />
            {esMosaico && (
              <>
                <span className="text-xs text-piedra">×</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={fila.ancho}
                  onChange={(evento) =>
                    actualizarFila(indice, "ancho", evento.target.value)
                  }
                  placeholder="Ancho"
                  className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-900"
                  aria-label={`Ancho de la sección ${indice + 1} (metros)`}
                />
              </>
            )}
            <span className="text-xs text-piedra">m</span>
            {filas.length > 1 && (
              <button
                type="button"
                onClick={() => quitarFila(indice)}
                className="ml-auto text-xs text-red-600 hover:underline"
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
        className="mt-2 text-xs font-medium text-terracota hover:underline"
      >
        + Agregar {esMosaico ? "otra sección" : "otro tramo"}
      </button>

      <div className="mt-3 flex items-center gap-2">
        <label className="text-xs text-piedra" htmlFor="merma-calculadora">
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
          className="w-14 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-900"
        />
        <span className="text-xs text-piedra">%</span>
      </div>

      <p className="mt-2 text-xs text-piedra">
        Total estimado:{" "}
        <span className="font-semibold text-carbon">
          {totalRedondeado > 0
            ? `${totalRedondeado} ${esMosaico ? "m²" : "ml"}`
            : "—"}
        </span>
        {total > 0 &&
          ` (${total.toFixed(2)} ${esMosaico ? "m²" : "ml"} + ${
            merma || 0
          }% de margen)`}
      </p>

      {unidadesEstimadas !== null && (
        <p className="mt-1 text-xs text-piedra">
          Eso son aproximadamente{" "}
          <span className="font-semibold text-carbon">
            {unidadesEstimadas} mosaicos
          </span>{" "}
          (a {MOSAICOS_POR_M2} piezas por m²).
        </p>
      )}

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={totalRedondeado <= 0}
          onClick={() => {
            onUsar(totalRedondeado);
            setAbierta(false);
          }}
          className="rounded-md bg-terracota px-3 py-1.5 text-xs font-medium text-white hover:bg-terracota-dark disabled:opacity-50"
        >
          Usar este cálculo
        </button>
        <button
          type="button"
          onClick={() => setAbierta(false)}
          className="text-xs text-piedra hover:underline"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
