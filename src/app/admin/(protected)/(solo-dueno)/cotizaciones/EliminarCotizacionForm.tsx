"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { eliminarCotizacion } from "./actions";

export function EliminarCotizacionForm({ id }: { id: string }) {
  const [state, formAction] = useActionState(
    eliminarCotizacion.bind(null, id),
    {}
  );
  useToastAccion(state, "Cotización eliminada.");

  return (
    <form action={formAction} className="mt-3">
      <ConfirmSubmitButton
        formAction={formAction}
        confirmMessage="¿Borrar esta cotización para siempre? Esto no se puede deshacer."
        className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
      >
        Borrar cotización
      </ConfirmSubmitButton>
    </form>
  );
}
