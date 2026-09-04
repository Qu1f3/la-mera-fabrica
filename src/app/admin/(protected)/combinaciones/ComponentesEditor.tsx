"use client";

import { componenteVacio, TIPOS_CEMENTO, UNIDADES_PESO, type ComponenteFormulario } from "./tipos";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";
const selectClass = `${inputClass} bg-white`;

/**
 * Editor de la lista de "componentes" (capas) de una combinación -- ej: una
 * "Espiral rojo con pringa negra" tiene dos componentes, "Fondo Rojo" y
 * "Pringa Negra", cada uno con su propio cemento/colorante. Lo comparten
 * NuevaCombinacionForm.tsx y EditarCombinacionForm.tsx (ver tipos.ts) en vez
 * de duplicar esta parte, que es la más grande de ambos formularios.
 *
 * Totalmente controlado desde el padre (mismo patrón que las líneas de
 * producto en produccion/nuevo/NuevoRegistroProduccionForm.tsx): este
 * componente no tiene su propio estado, solo llama a `onChange` con la
 * lista completa actualizada.
 */
export function ComponentesEditor({
  componentes,
  onChange,
  generarKey,
}: {
  componentes: ComponenteFormulario[];
  onChange: (componentes: ComponenteFormulario[]) => void;
  /** Genera un id único para el `key` de React de una fila nueva. */
  generarKey: () => string;
}) {
  function actualizar(key: string, cambios: Partial<ComponenteFormulario>) {
    onChange(componentes.map((c) => (c.key === key ? { ...c, ...cambios } : c)));
  }

  function agregar() {
    onChange([...componentes, componenteVacio(generarKey())]);
  }

  function quitar(key: string) {
    if (componentes.length <= 1) return;
    onChange(componentes.filter((c) => c.key !== key));
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {componentes.map((componente, indice) => (
        <div key={componente.key} className="rounded-md border border-neutral-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">
              Componente {componentes.length > 1 ? indice + 1 : ""}
            </span>
            {componentes.length > 1 && (
              <button
                type="button"
                onClick={() => quitar(componente.key)}
                className="text-xs font-medium text-neutral-400 hover:text-red-600"
              >
                Quitar
              </button>
            )}
          </div>

          <div className="mt-1 grid grid-cols-1 gap-3">
            <label className="text-xs text-neutral-500">
              Nombre del componente
              <input
                value={componente.nombre}
                onChange={(e) => actualizar(componente.key, { nombre: e.target.value })}
                placeholder='Ej: "Fondo Rojo", "Pringa Negra", "Blanco"'
                className={`${inputClass} mt-1`}
              />
            </label>

            <div className="grid grid-cols-1 gap-3 rounded-md bg-neutral-50 p-2.5 sm:grid-cols-[1fr_1fr_auto]">
              <label className="text-xs text-neutral-500">
                Cemento -- tipo
                <select
                  value={componente.cementoTipo}
                  onChange={(e) => actualizar(componente.key, { cementoTipo: e.target.value })}
                  className={`${selectClass} mt-1`}
                >
                  {TIPOS_CEMENTO.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-neutral-500">
                Cantidad
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={componente.cementoCantidad}
                  onChange={(e) => actualizar(componente.key, { cementoCantidad: e.target.value })}
                  placeholder="Déjalo vacío si no hay una exacta"
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs text-neutral-500">
                Unidad
                <select
                  value={componente.cementoUnidad}
                  onChange={(e) => actualizar(componente.key, { cementoUnidad: e.target.value })}
                  className={`${selectClass} mt-1 sm:w-20`}
                >
                  {UNIDADES_PESO.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-md bg-neutral-50 p-2.5 sm:grid-cols-[1fr_1fr_auto]">
              <label className="text-xs text-neutral-500">
                Colorante -- color
                <input
                  value={componente.coloranteColor}
                  onChange={(e) => actualizar(componente.key, { coloranteColor: e.target.value })}
                  placeholder="Ej: rojo, negro, blanco"
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs text-neutral-500">
                Cantidad
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={componente.coloranteCantidad}
                  onChange={(e) => actualizar(componente.key, { coloranteCantidad: e.target.value })}
                  placeholder="Déjalo vacío si no hay una exacta"
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs text-neutral-500">
                Unidad
                <select
                  value={componente.coloranteUnidad}
                  onChange={(e) => actualizar(componente.key, { coloranteUnidad: e.target.value })}
                  className={`${selectClass} mt-1 sm:w-20`}
                >
                  {UNIDADES_PESO.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="text-xs text-neutral-500">
              Nota de este componente (opcional -- ej: &quot;depende del empleado&quot;, &quot;no hay
              cantidad exacta porque el cemento ya es gris&quot;)
              <input
                value={componente.notas}
                onChange={(e) => actualizar(componente.key, { notas: e.target.value })}
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={agregar}
        className="text-left text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:underline"
      >
        + Agregar otro componente
      </button>
    </div>
  );
}
