import Link from "next/link";

const selectClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-carbon focus:border-terracota focus:outline-none";

export function FilterBar({
  categorias,
  estilos,
  acabados,
  aplicaciones,
  valores,
}: {
  categorias: { slug: string; nombre: string }[];
  estilos: string[];
  acabados: string[];
  aplicaciones: string[];
  valores: {
    tipo?: string;
    categoria?: string;
    estilo?: string;
    acabado?: string;
    aplicacion?: string;
    q?: string;
  };
}) {
  const hayFiltrosActivos = Object.values(valores).some(Boolean);

  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="q" className="text-xs font-medium text-piedra">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={valores.q ?? ""}
          placeholder="Nombre"
          className={selectClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-xs font-medium text-piedra">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={valores.tipo ?? ""}
          className={selectClass}
        >
          <option value="">Todos</option>
          <option value="MOSAICO">Mosaico</option>
          <option value="MOLDURA">Moldura</option>
        </select>
      </div>

      {categorias.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="categoria" className="text-xs font-medium text-piedra">
            Categoría
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={valores.categoria ?? ""}
            className={selectClass}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {estilos.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="estilo" className="text-xs font-medium text-piedra">
            Diseño
          </label>
          <select
            id="estilo"
            name="estilo"
            defaultValue={valores.estilo ?? ""}
            className={selectClass}
          >
            <option value="">Todos</option>
            {estilos.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      )}

      {acabados.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="acabado" className="text-xs font-medium text-piedra">
            Acabado
          </label>
          <select
            id="acabado"
            name="acabado"
            defaultValue={valores.acabado ?? ""}
            className={selectClass}
          >
            <option value="">Todos</option>
            {acabados.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}

      {aplicaciones.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="aplicacion" className="text-xs font-medium text-piedra">
            Aplicación
          </label>
          <select
            id="aplicacion"
            name="aplicacion"
            defaultValue={valores.aplicacion ?? ""}
            className={selectClass}
          >
            <option value="">Todas</option>
            {aplicaciones.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-carbon px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Filtrar
        </button>
        {hayFiltrosActivos && (
          <Link
            href="/"
            className="flex items-center px-2 text-sm text-piedra underline"
          >
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );
}
