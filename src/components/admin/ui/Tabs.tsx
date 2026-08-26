"use client";

import { useState, type ReactNode } from "react";

export type TabDef = {
  clave: string;
  etiqueta: string;
  contenido: ReactNode;
};

/**
 * Tabs simples para el panel (sin librerias externas). Todo el contenido de
 * las pestañas se recibe ya armado -- este componente solo controla cual se
 * muestra, para que quien lo use no tenga que reimplementar el patron de
 * estado cada vez.
 */
export function Tabs({
  tabs,
  defaultTab,
}: {
  tabs: TabDef[];
  defaultTab?: string;
}) {
  const [activa, setActiva] = useState(defaultTab ?? tabs[0]?.clave);
  const tabActiva = tabs.find((t) => t.clave === activa) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-neutral-200"
      >
        {tabs.map((tab) => {
          const seleccionada = tab.clave === tabActiva?.clave;
          return (
            <button
              key={tab.clave}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              onClick={() => setActiva(tab.clave)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                seleccionada
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.etiqueta}
            </button>
          );
        })}
      </div>
      <div className="pt-4">{tabActiva?.contenido}</div>
    </div>
  );
}
