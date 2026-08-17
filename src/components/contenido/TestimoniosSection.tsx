import type { TestimonioPublico } from "@/lib/types";

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

function Estrellas({ calificacion }: { calificacion: number }) {
  return (
    <div className="flex gap-0.5 text-terracota" aria-label={`${calificacion} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill={i < calificacion ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1}
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9L10 14.9l-5.2 2.9 1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Solo testimonios reales, cargados por el admin. Si no hay ninguno activo,
 * esta sección no se muestra en absoluto — nunca con contenido de relleno
 * (ver Fase 0).
 */
export function TestimoniosSection({
  testimonios,
}: {
  testimonios: TestimonioPublico[];
}) {
  if (testimonios.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h2 className="text-xl font-semibold text-carbon">
        Lo que dicen nuestros clientes
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonios.map((testimonio) => (
          <figure
            key={testimonio.id}
            className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5"
          >
            {testimonio.calificacion != null && (
              <Estrellas calificacion={testimonio.calificacion} />
            )}
            <blockquote className="flex-1 text-sm text-neutral-700">
              &ldquo;{testimonio.texto}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-2.5">
              {testimonio.fotoUrl ? (
                // <img> normal a propósito, no next/image: la foto viene de
                // un enlace que el admin escribe a mano (cualquier dominio),
                // y next/image exige que el dominio esté en la lista blanca
                // de next.config.ts o revienta en tiempo de ejecución.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={testimonio.fotoUrl}
                  alt={testimonio.nombreCliente}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-arena-dark text-xs font-semibold text-terracota-dark">
                  {iniciales(testimonio.nombreCliente)}
                </div>
              )}
              <span className="text-sm font-medium text-carbon">
                {testimonio.nombreCliente}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
