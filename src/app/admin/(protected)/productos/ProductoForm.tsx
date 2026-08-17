"use client";

import { useActionState, useState } from "react";
import type { ProductoFormState } from "./actions";
import type {
  Disponibilidad,
  EspecificacionesMoldura,
  EspecificacionesMosaico,
  TipoProducto,
} from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";
const labelClass = "text-sm font-medium text-neutral-700";

export type ProductoFormValores = {
  nombre: string;
  slug: string;
  sku: string | null;
  tipo: TipoProducto;
  categoriaId: string | null;
  descripcion: string | null;
  estilo: string | null;
  acabado: string | null;
  colores: string[];
  aplicaciones: string[];
  disponibilidad: Disponibilidad;
  destacado: boolean;
  activo: boolean;
  especificaciones: EspecificacionesMosaico | EspecificacionesMoldura | null;
};

const VALORES_VACIOS: ProductoFormValores = {
  nombre: "",
  slug: "",
  sku: "",
  tipo: "MOSAICO",
  categoriaId: "",
  descripcion: "",
  estilo: "",
  acabado: "",
  colores: [],
  aplicaciones: [],
  disponibilidad: "DISPONIBLE",
  destacado: false,
  activo: true,
  especificaciones: null,
};

export function ProductoForm({
  action,
  valoresIniciales,
  categorias,
  textoBoton,
}: {
  action: (
    prevState: ProductoFormState,
    formData: FormData
  ) => Promise<ProductoFormState>;
  valoresIniciales?: ProductoFormValores;
  categorias: { id: string; nombre: string }[];
  textoBoton: string;
}) {
  const valores = valoresIniciales ?? VALORES_VACIOS;
  const [state, formAction, pending] = useActionState(action, {});
  const [tipo, setTipo] = useState<TipoProducto>(valores.tipo);

  const specMosaico = (
    valores.tipo === "MOSAICO" ? valores.especificaciones : null
  ) as EspecificacionesMosaico | null;
  const specMoldura = (
    valores.tipo === "MOLDURA" ? valores.especificaciones : null
  ) as EspecificacionesMoldura | null;

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="nombre" className={labelClass}>
            Nombre *
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            defaultValue={valores.nombre}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="slug" className={labelClass}>
            Slug (URL)
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={valores.slug}
            placeholder="Se genera solo si lo dejas vacío"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="sku" className={labelClass}>
            Código / SKU
          </label>
          <input
            id="sku"
            name="sku"
            defaultValue={valores.sku ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="tipo" className={labelClass}>
            Tipo *
          </label>
          <select
            id="tipo"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoProducto)}
            className={inputClass}
          >
            <option value="MOSAICO">Mosaico</option>
            <option value="MOLDURA">Moldura</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="categoriaId" className={labelClass}>
            Categoría
          </label>
          <select
            id="categoriaId"
            name="categoriaId"
            defaultValue={valores.categoriaId ?? ""}
            className={inputClass}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="descripcion" className={labelClass}>
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={4}
            defaultValue={valores.descripcion ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="estilo" className={labelClass}>
            Estilo
          </label>
          <input
            id="estilo"
            name="estilo"
            defaultValue={valores.estilo ?? ""}
            placeholder="Ej: Rústico, Moderno"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="acabado" className={labelClass}>
            Acabado
          </label>
          <input
            id="acabado"
            name="acabado"
            defaultValue={valores.acabado ?? ""}
            placeholder="Ej: Mate, Brillante"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="colores" className={labelClass}>
            Colores
          </label>
          <input
            id="colores"
            name="colores"
            defaultValue={valores.colores.join(", ")}
            placeholder="Separados por coma"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="aplicaciones" className={labelClass}>
            Aplicaciones recomendadas
          </label>
          <input
            id="aplicaciones"
            name="aplicaciones"
            defaultValue={valores.aplicaciones.join(", ")}
            placeholder="Ej: interior, exterior, baño"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="disponibilidad" className={labelClass}>
            Disponibilidad
          </label>
          <select
            id="disponibilidad"
            name="disponibilidad"
            defaultValue={valores.disponibilidad}
            className={inputClass}
          >
            <option value="DISPONIBLE">Disponible</option>
            <option value="BAJO_PEDIDO">Bajo pedido</option>
            <option value="AGOTADO">Agotado</option>
            <option value="DESCONTINUADO">Descontinuado</option>
          </select>
        </div>

        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="destacado"
              defaultChecked={valores.destacado}
              className="h-4 w-4"
            />
            Destacado
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={valores.activo}
              className="h-4 w-4"
            />
            Activo (visible en el sitio)
          </label>
        </div>
      </div>

      <fieldset className="rounded-md border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium text-neutral-700">
          Datos técnicos —{" "}
          {tipo === "MOSAICO" ? "mosaico (por caja)" : "moldura (por pieza)"}
        </legend>

        {tipo === "MOSAICO" ? (
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <CampoNumero
              name="largoCm"
              label="Largo (cm)"
              defaultValue={specMosaico?.largoCm}
            />
            <CampoNumero
              name="anchoCm"
              label="Ancho (cm)"
              defaultValue={specMosaico?.anchoCm}
            />
            <CampoNumero
              name="espesorMm"
              label="Espesor (mm)"
              defaultValue={specMosaico?.espesorMm}
            />
            <CampoNumero
              name="coberturaCajaM2"
              label="Cobertura por caja (m²)"
              defaultValue={specMosaico?.coberturaCajaM2}
            />
            <CampoNumero
              name="piezasPorCaja"
              label="Piezas por caja"
              defaultValue={specMosaico?.piezasPorCaja}
            />
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <CampoNumero
              name="longitudPiezaCm"
              label="Longitud de pieza (cm)"
              defaultValue={specMoldura?.longitudPiezaCm}
            />
            <CampoNumero
              name="perfilMm"
              label="Perfil (mm)"
              defaultValue={specMoldura?.perfilMm}
            />
            <CampoNumero
              name="altoMm"
              label="Alto (mm)"
              defaultValue={specMoldura?.altoMm}
            />
          </div>
        )}
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Guardando…" : textoBoton}
      </button>
    </form>
  );
}

function CampoNumero({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-neutral-600">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        step="any"
        defaultValue={defaultValue ?? ""}
        className={inputClass}
      />
    </div>
  );
}
