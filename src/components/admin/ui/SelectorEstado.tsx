"use client";

import { useRef, useState } from "react";

export type OpcionEstado = {
  valor: string;
  etiqueta: string;
  colorClasses: string;
};

/**
 * Selector de estado "amigable": muestra el estado actual como una pastilla
 * de color (mismo esquema que EstadoBadge) y al hacer clic despliega la
 * lista completa de estados, cada uno con su propio color, en vez del
 * <select> nativo del navegador (letra pequeña, sin color, difícil de leer
 * rápido para el personal de planta). Guarda la selección en un input
 * oculto para que el <form action={...}> del servidor siga funcionando
 * igual que antes.
 */
export function SelectorEstado({
  nombre,
  opciones,
  valorInicial,
}: {
  nombre: string;
  opciones: OpcionEstado[];
  valorInicial: string;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [abierto, setAbierto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const actual = opciones.find((o) => o.valor === valor) ?? opciones[0];

  return (
    <div ref={raizRef} className="relative">
      <input type="hidden" name={nombre} value={valor} />
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className={`flex min-w-[190px] items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm ${actual.colorClasses}`}
      >
        {actual.etiqueta}
        <span aria-hidden className="text-xs opacity-60">▾</span>
      </button>
      {abierto && (
        <>
          {/* Capa para cerrar al hacer clic afuera, sin listeners globales */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <ul className="absolute z-20 mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-neutral-200 bg-white p-1.5 shadow-lg">
            {opciones.map((opcion) => (
              <li key={opcion.valor}>
                <button
                  type="button"
                  onClick={() => {
                    setValor(opcion.valor);
                    setAbierto(false);
                  }}
                  className={`mb-1 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium last:mb-0 ${opcion.colorClasses} ${
                    opcion.valor === valor ? "ring-2 ring-offset-1 ring-neutral-400" : ""
                  }`}
                >
                  {opcion.etiqueta}
                  {opcion.valor === valor && <span aria-hidden>✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
