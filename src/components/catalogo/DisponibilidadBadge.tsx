import type { Disponibilidad } from "@/lib/types";
import { ETIQUETA_DISPONIBILIDAD } from "@/lib/types";

const ESTILOS: Record<Disponibilidad, string> = {
  DISPONIBLE: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  BAJO_PEDIDO: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  AGOTADO: "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-500/20",
  DESCONTINUADO: "bg-neutral-100 text-neutral-500 ring-1 ring-inset ring-neutral-500/20",
};

export function DisponibilidadBadge({
  disponibilidad,
}: {
  disponibilidad: Disponibilidad;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS[disponibilidad]}`}
    >
      {ETIQUETA_DISPONIBILIDAD[disponibilidad]}
    </span>
  );
}
