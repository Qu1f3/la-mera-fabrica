"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type OpcionCombobox = {
  id: string;
  etiqueta: string;
  subtexto?: string;
  // Miniatura opcional (ej: foto del producto) mostrada junto al texto en
  // la lista de resultados -- si no se pasa, la fila se ve igual que
  // siempre (ningún uso existente del Combobox se ve afectado).
  imagenUrl?: string;
};

/**
 * Selector desplegable con autocompletado: se puede escribir para filtrar
 * (por etiqueta o subtexto) o elegir de la lista con el mouse o el teclado
 * (flechas + Enter, Escape para cerrar). Reemplaza a un <select> nativo
 * cuando la lista es larga y conviene poder escribir para encontrar la
 * opción en vez de desplazarse a mano (ej: elegir un producto al armar un
 * pedido).
 *
 * No usa ninguna librería externa -- mismo criterio que el resto del kit de
 * UI del panel (Modal, Tabs, Toast).
 */
export function Combobox({
  opciones,
  valorId,
  onSeleccionar,
  placeholder = "Buscar…",
  className = "",
}: {
  opciones: OpcionCombobox[];
  valorId: string;
  onSeleccionar: (id: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const seleccionada = opciones.find((o) => o.id === valorId) ?? null;
  const [texto, setTexto] = useState(seleccionada?.etiqueta ?? "");
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const raizRef = useRef<HTMLDivElement>(null);

  // Si el id seleccionado cambia desde afuera del componente (ej: se
  // limpió toda la fila), refleja el texto correspondiente. Patrón
  // "ajustar estado durante el render" (sin useEffect) comparando contra
  // el último id ya reflejado, para no pisar lo que el usuario está
  // escribiendo en cada tecla.
  const [idReflejado, setIdReflejado] = useState(valorId);
  if (valorId !== idReflejado) {
    setIdReflejado(valorId);
    setTexto(seleccionada?.etiqueta ?? "");
  }

  const filtradas = useMemo(() => {
    const consulta = texto.trim().toLowerCase();
    if (!consulta || texto === seleccionada?.etiqueta) return opciones;
    return opciones.filter(
      (opcion) =>
        opcion.etiqueta.toLowerCase().includes(consulta) ||
        (opcion.subtexto?.toLowerCase().includes(consulta) ?? false)
    );
  }, [texto, opciones, seleccionada]);

  useEffect(() => {
    function alClicFuera(evento: MouseEvent) {
      if (raizRef.current && !raizRef.current.contains(evento.target as Node)) {
        setAbierto(false);
        setTexto(seleccionada?.etiqueta ?? "");
      }
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [seleccionada]);

  function elegir(opcion: OpcionCombobox) {
    onSeleccionar(opcion.id);
    setTexto(opcion.etiqueta);
    setAbierto(false);
  }

  return (
    <div ref={raizRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={abierto}
        aria-autocomplete="list"
        value={texto}
        placeholder={placeholder}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setAbierto(true);
          setIndiceActivo(0);
          if (valorId) onSeleccionar("");
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={(evento) => {
          if (!abierto && (evento.key === "ArrowDown" || evento.key === "Enter")) {
            setAbierto(true);
            return;
          }
          if (evento.key === "ArrowDown") {
            evento.preventDefault();
            setIndiceActivo((i) => Math.min(i + 1, filtradas.length - 1));
          } else if (evento.key === "ArrowUp") {
            evento.preventDefault();
            setIndiceActivo((i) => Math.max(i - 1, 0));
          } else if (evento.key === "Enter") {
            evento.preventDefault();
            const opcion = filtradas[indiceActivo];
            if (opcion) elegir(opcion);
          } else if (evento.key === "Escape") {
            setAbierto(false);
            setTexto(seleccionada?.etiqueta ?? "");
          }
        }}
        className={className}
      />
      {abierto && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full min-w-[240px] overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 text-sm shadow-lg">
          {filtradas.length === 0 && (
            <li className="px-3 py-2 text-neutral-400">Sin resultados.</li>
          )}
          {filtradas.map((opcion, indice) => (
            <li key={opcion.id}>
              <button
                type="button"
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => elegir(opcion)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left ${
                  indice === indiceActivo ? "bg-neutral-100" : "hover:bg-neutral-50"
                }`}
              >
                {opcion.imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura
                  // chica en una lista desplegable; next/image no aporta nada acá
                  // (imagen ya optimizada en origen) y complica el loader.
                  <img
                    src={opcion.imagenUrl}
                    alt=""
                    loading="lazy"
                    className="h-8 w-8 flex-shrink-0 rounded object-cover"
                  />
                ) : null}
                <span className="flex min-w-0 flex-col items-start">
                  <span className="truncate text-neutral-900">{opcion.etiqueta}</span>
                  {opcion.subtexto && (
                    <span className="truncate text-xs text-neutral-500">
                      {opcion.subtexto}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
