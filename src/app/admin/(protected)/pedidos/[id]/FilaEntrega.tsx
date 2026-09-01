"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { EstadoBadge } from "@/components/admin/ui/EstadoBadge";
import { SelectorEstado } from "@/components/admin/ui/SelectorEstado";
import { formatearFechaHonduras } from "@/lib/fecha";
import { COLOR_ESTADO_ENTREGA, ETIQUETA_ESTADO_ENTREGA } from "@/lib/types";
import type { EstadoEntrega } from "@/lib/types";
import { actualizarEstadoEntrega, eliminarEntrega } from "../actions";

type Entrega = {
  id: string;
  fechaProgramada: Date | null;
  fechaReal: Date | null;
  estado: string;
  notas: string | null;
};

export function FilaEntrega({
  entrega,
  estadosEntrega,
}: {
  entrega: Entrega;
  estadosEntrega: EstadoEntrega[];
}) {
  const [estadoGuardar, formActionGuardar] = useActionState(
    actualizarEstadoEntrega.bind(null, entrega.id),
    {}
  );
  useToastAccion(estadoGuardar, "Entrega actualizada.");

  const [estadoBorrar, formActionBorrar] = useActionState(
    eliminarEntrega.bind(null, entrega.id),
    {}
  );
  useToastAccion(estadoBorrar, "Entrega eliminada.");

  return (
    <li className="rounded-lg border border-neutral-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <p className="font-medium text-neutral-900">
            {entrega.fechaProgramada
              ? `Programada: ${formatearFechaHonduras(entrega.fechaProgramada)}`
              : "Sin fecha programada"}
          </p>
          {entrega.fechaReal && (
            <p className="text-neutral-500">
              Entregada el {formatearFechaHonduras(entrega.fechaReal)}
            </p>
          )}
        </div>
        <EstadoBadge
          label={ETIQUETA_ESTADO_ENTREGA[entrega.estado as EstadoEntrega]}
          colorClasses={COLOR_ESTADO_ENTREGA[entrega.estado as EstadoEntrega]}
        />
      </div>
      {entrega.notas && (
        <p className="mt-1 text-sm text-neutral-600">{entrega.notas}</p>
      )}
      <form
        action={formActionGuardar}
        className="mt-2 flex flex-wrap items-end gap-2"
      >
        <SelectorEstado
          nombre="estado"
          valorInicial={entrega.estado}
          opciones={estadosEntrega.map((estado) => ({
            valor: estado,
            etiqueta: ETIQUETA_ESTADO_ENTREGA[estado],
            colorClasses: COLOR_ESTADO_ENTREGA[estado],
          }))}
        />
        <input
          name="notas"
          placeholder="Nota (opcional)"
          defaultValue={entrega.notas ?? ""}
          className="min-w-[160px] flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Guardar
        </button>
      </form>
      <form action={formActionBorrar} className="mt-2">
        <ConfirmSubmitButton
          formAction={formActionBorrar}
          confirmMessage="¿Borrar esta entrega programada? Esto no se puede deshacer."
          className="text-xs font-medium text-red-600 hover:underline"
        >
          Borrar
        </ConfirmSubmitButton>
      </form>
    </li>
  );
}
