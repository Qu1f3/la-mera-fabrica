"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { borrarImagenBanner } from "../actions";

export function BorrarImagenBannerForm({ id }: { id: string }) {
  const [state, formAction] = useActionState(
    borrarImagenBanner.bind(null, id),
    {}
  );
  useToastAccion(state, "Imagen eliminada.");

  return (
    <form action={formAction}>
      <ConfirmSubmitButton
        confirmMessage="¿Quitar la imagen de este banner?"
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        Quitar imagen
      </ConfirmSubmitButton>
    </form>
  );
}
