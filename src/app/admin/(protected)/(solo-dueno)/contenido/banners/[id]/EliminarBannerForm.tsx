"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { eliminarBanner } from "../actions";

export function EliminarBannerForm({ id, titulo }: { id: string; titulo: string }) {
  const [state, formAction] = useActionState(
    eliminarBanner.bind(null, id),
    {}
  );
  useToastAccion(state, "Banner eliminado.");

  return (
    <form action={formAction} className="mt-3">
      <ConfirmSubmitButton
        formAction={formAction}
        confirmMessage={`¿Borrar el banner "${titulo}" para siempre?`}
        className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
      >
        Borrar banner
      </ConfirmSubmitButton>
    </form>
  );
}
