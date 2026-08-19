import Link from "next/link";

/**
 * El usuario pidió el catálogo por páginas (16 productos, 4 filas de 4 —
 * ver `PRODUCTOS_POR_PAGINA` en `src/lib/data/catalogo.ts`). Es un
 * componente de servidor con enlaces normales (`<Link>`), no botones de
 * JavaScript — así funciona sin JS y cada página es una URL real que se
 * puede compartir/recargar, igual que los filtros de `FilterBar`.
 */
function construirHref(
  pagina: number,
  parametros: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor) params.set(clave, valor);
  }
  // La página 1 es la URL "limpia" (sin ?page=1), para que los enlaces del
  // catálogo sin filtros ni paginar sigan siendo simplemente "/".
  if (pagina > 1) params.set("page", String(pagina));

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function Paginacion({
  paginaActual,
  totalPaginas,
  parametros,
}: {
  paginaActual: number;
  totalPaginas: number;
  parametros: Record<string, string | undefined>;
}) {
  if (totalPaginas <= 1) return null;

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
  const esPrimera = paginaActual <= 1;
  const esUltima = paginaActual >= totalPaginas;

  return (
    <nav
      aria-label="Paginación del catálogo"
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    >
      <Link
        href={construirHref(Math.max(1, paginaActual - 1), parametros)}
        aria-disabled={esPrimera}
        tabIndex={esPrimera ? -1 : undefined}
        className={`rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium ${
          esPrimera
            ? "pointer-events-none text-neutral-300"
            : "text-carbon hover:bg-arena"
        }`}
      >
        Anterior
      </Link>

      {paginas.map((p) => (
        <Link
          key={p}
          href={construirHref(p, parametros)}
          aria-current={p === paginaActual ? "page" : undefined}
          className={`min-w-9 rounded-md px-3 py-1.5 text-center text-sm font-medium ${
            p === paginaActual
              ? "bg-terracota text-white"
              : "text-carbon hover:bg-arena"
          }`}
        >
          {p}
        </Link>
      ))}

      <Link
        href={construirHref(Math.min(totalPaginas, paginaActual + 1), parametros)}
        aria-disabled={esUltima}
        tabIndex={esUltima ? -1 : undefined}
        className={`rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium ${
          esUltima
            ? "pointer-events-none text-neutral-300"
            : "text-carbon hover:bg-arena"
        }`}
      >
        Siguiente
      </Link>
    </nav>
  );
}
