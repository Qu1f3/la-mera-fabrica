"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { actualizarBanner } from "../actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";
const labelClass = "text-sm font-medium text-neutral-700";

function comoFechaInput(fecha: Date | null): string {
  return fecha ? fecha.toISOString().slice(0, 10) : "";
}

type Banner = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  enlace: string | null;
  orden: number;
  activo: boolean;
  fechaInicio: Date | null;
  fechaFin: Date | null;
};

export function EditarBannerForm({ banner }: { banner: Banner }) {
  const [state, formAction] = useActionState(
    actualizarBanner.bind(null, banner.id),
    {}
  );
  useToastAccion(state, "Banner actualizado.");

  return (
    <form
      action={formAction}
      className="mt-6 space-y-5 rounded-lg border border-neutral-200 bg-white p-6"
    >
      <div className="space-y-1">
        <label htmlFor="titulo" className={labelClass}>
          Título *
        </label>
        <input
          id="titulo"
          name="titulo"
          defaultValue={banner.titulo}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="subtitulo" className={labelClass}>
          Subtítulo (opcional)
        </label>
        <input
          id="subtitulo"
          name="subtitulo"
          defaultValue={banner.subtitulo ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="enlace" className={labelClass}>
          Enlace (opcional)
        </label>
        <input
          id="enlace"
          name="enlace"
          defaultValue={banner.enlace ?? ""}
          placeholder="/productos?tipo=MOSAICO"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="fechaInicio" className={labelClass}>
            Desde (opcional)
          </label>
          <input
            id="fechaInicio"
            name="fechaInicio"
            type="date"
            defaultValue={comoFechaInput(banner.fechaInicio)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="fechaFin" className={labelClass}>
            Hasta (opcional)
          </label>
          <input
            id="fechaFin"
            name="fechaFin"
            type="date"
            defaultValue={comoFechaInput(banner.fechaFin)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="orden" className={labelClass}>
          Orden
        </label>
        <input
          id="orden"
          name="orden"
          type="number"
          defaultValue={banner.orden}
          className={`${inputClass} w-24`}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={banner.activo}
          className="h-4 w-4"
        />
        Activo
      </label>

      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Guardar cambios
      </button>
    </form>
  );
}
