"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { borrarImagenNosotros } from "./actions";

export function BorrarImagenNosotrosForm() {
  const [state, formAction] = useActionState(borrarImagenNosotros, {});
  useToastAccion(state, "Imagen eliminada.");

  return (
    <form action={formAction}>
      <ConfirmSubmitButton
        confirmMessage="¿Quitar esta imagen?"
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        Quitar imagen
      </ConfirmSubmitButton>
    </form>
  );
}
