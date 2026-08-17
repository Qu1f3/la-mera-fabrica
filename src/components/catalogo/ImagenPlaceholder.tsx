import type { TipoProducto } from "@/lib/types";
import { ETIQUETA_TIPO } from "@/lib/types";

/**
 * Placeholder de marca para productos sin fotografía todavía. "Sin foto" es
 * un estado normal en este catálogo (ver Fase 0) — esto reemplaza un ícono
 * de imagen rota o un cuadro gris vacío por algo con identidad propia: un
 * patrón que evoca líneas de mosaico, en la paleta de la marca.
 */
export function ImagenPlaceholder({
  tipo,
  patternId,
  className = "",
}: {
  tipo: TipoProducto;
  patternId: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-arena ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-arena-dark"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={patternId}
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="26"
              height="26"
              x="1"
              y="1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="200" height="200" fill={`url(#${patternId})`} />
      </svg>
      <span className="relative rounded-full bg-white/85 px-3 py-1 text-center text-xs font-medium tracking-wide text-piedra">
        {ETIQUETA_TIPO[tipo]} · foto próximamente
      </span>
    </div>
  );
}
