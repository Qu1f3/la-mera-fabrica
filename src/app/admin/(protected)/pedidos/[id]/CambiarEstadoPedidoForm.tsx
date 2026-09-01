"use client";

import { useActionState } from "react";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { SelectorEstado } from "@/components/admin/ui/SelectorEstado";
import { ETIQUETA_ESTADO_PEDIDO, COLOR_ESTADO_PEDIDO } from "@/lib/types";
import type { EstadoPedido } from "@/lib/types";
import { cambiarEstadoPedido } from "../actions";

export function CambiarEstadoPedidoForm({
  pedidoId,
  estadoActual,
  estados,
}: {
  pedidoId: string;
  estadoActual: string;
  estados: EstadoPedido[];
}) {
  const [state, formAction] = useActionState(
    cambiarEstadoPedido.bind(null, pedidoId),
    {}
  );
  useToastAccion(state, "Estado del pedido actualizado.");

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2">
      <SelectorEstado
        nombre="estado"
        valorInicial={estadoActual}
        opciones={estados.map((estado) => ({
          valor: estado,
          etiqueta: ETIQUETA_ESTADO_PEDIDO[estado],
          colorClasses: COLOR_ESTADO_PEDIDO[estado],
        }))}
      />
      <input
        name="notas"
        placeholder="Nota opcional del cambio"
        className="min-w-[200px] flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
      />
      <button
        type="submit"
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
      >
        Guardar
      </button>
    </form>
  );
}
