"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { actualizarTestimonio, eliminarTestimonio } from "./actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

type TestimonioItem = {
  id: string;
  nombreCliente: string;
  texto: string;
  calificacion: number | null;
  fotoUrl: string | null;
  activo: boolean;
};

export function FilaTestimonio({ testimonio }: { testimonio: TestimonioItem }) {
  const [estadoGuardar, formActionGuardar] = useActionState(
    actualizarTestimonio.bind(null, testimonio.id),
    {}
  );
  useToastAccion(estadoGuardar, "Testimonio actualizado.");

  const [estadoBorrar, formActionBorrar] = useActionState(
    eliminarTestimonio.bind(null, testimonio.id),
    {}
  );
  useToastAccion(estadoBorrar, "Testimonio eliminado.");

  return (
    <form
      action={formActionGuardar}
      className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">
            Nombre del cliente
          </label>
          <input
            name="nombreCliente"
            defaultValue={testimonio.nombreCliente}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-500">
            Calificación (1 a 5, opcional)
          </label>
          <input
            type="number"
            name="calificacion"
            min={1}
            max={5}
            defaultValue={testimonio.calificacion ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500">
          Testimonio
        </label>
        <textarea
          name="texto"
          defaultValue={testimonio.texto}
          required
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500">
          Foto del cliente (enlace, opcional)
        </label>
        <input
          name="fotoUrl"
          defaultValue={testimonio.fotoUrl ?? ""}
          placeholder="https://..."
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-1.5 text-xs text-neutral-600">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={testimonio.activo}
            className="h-4 w-4"
          />
          Activo
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Guardar
          </button>
          <ConfirmSubmitButton
            formAction={formActionBorrar}
            confirmMessage="¿Borrar este testimonio?"
            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Borrar
          </ConfirmSubmitButton>
        </div>
      </div>
    </form>
  );
}
