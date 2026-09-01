"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { actualizarFaq, eliminarFaq } from "./actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

type FaqItem = {
  id: string;
  pregunta: string;
  respuesta: string;
  orden: number;
  activo: boolean;
};

export function FilaFaq({ faq }: { faq: FaqItem }) {
  const [estadoGuardar, formActionGuardar] = useActionState(
    actualizarFaq.bind(null, faq.id),
    {}
  );
  useToastAccion(estadoGuardar, "Pregunta actualizada.");

  const [estadoBorrar, formActionBorrar] = useActionState(
    eliminarFaq.bind(null, faq.id),
    {}
  );
  useToastAccion(estadoBorrar, "Pregunta eliminada.");

  return (
    <form
      action={formActionGuardar}
      className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
    >
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500">
          Pregunta
        </label>
        <input
          name="pregunta"
          defaultValue={faq.pregunta}
          required
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500">
          Respuesta
        </label>
        <textarea
          name="respuesta"
          defaultValue={faq.respuesta}
          required
          rows={2}
          className={inputClass}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
            Orden
            <input
              type="number"
              name="orden"
              defaultValue={faq.orden}
              className={`${inputClass} w-16`}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={faq.activo}
              className="h-4 w-4"
            />
            Activa
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Guardar
          </button>
          <ConfirmSubmitButton
            formAction={formActionBorrar}
            confirmMessage="¿Borrar esta pregunta frecuente?"
            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Borrar
          </ConfirmSubmitButton>
        </div>
      </div>
    </form>
  );
}
