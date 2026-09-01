"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { eliminarPedido } from "../actions";

export function EliminarPedidoForm({ id, codigo }: { id: string; codigo: string }) {
  const [state, formAction] = useActionState(
    eliminarPedido.bind(null, id),
    {}
  );
  useToastAccion(state, "Pedido eliminado.");

  return (
    <form action={formAction} className="mt-3">
      <ConfirmSubmitButton
        formAction={formAction}
        confirmMessage={`¿Borrar el pedido #${codigo} para siempre? Esto no se puede deshacer.`}
        className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
      >
        Borrar pedido
      </ConfirmSubmitButton>
    </form>
  );
}
