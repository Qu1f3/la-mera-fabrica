"use client";

import { alternarActivoTipoPagoExtra } from "./actions";

export function TipoPagoExtraToggle({ id, activo }: { id: string; activo: boolean }) {
  return (
    <form action={alternarActivoTipoPagoExtra.bind(null, id, !activo)}>
      <button
        type="submit"
        className="text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:underline"
      >
        {activo ? "Desactivar" : "Activar"}
      </button>
    </form>
  );
}
