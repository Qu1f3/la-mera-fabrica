"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const selectClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-carbon focus:border-terracota focus:outline-none";

// Cuánto esperar después de la última tecla en "Buscar" antes de aplicar el
// filtro -- el resto de los campos (selects) se aplican al toque, ya que
// elegir una opción es una sola acción, no algo continuo como escribir.
const DEBOUNCE_BUSQUEDA_MS = 400;

type ValoresFiltro = {
  tipo?: string;
  categoria?: string;
  estilo?: string;
  acabado?: string;
  aplicacion?: string;
  q?: string;
};

/**
 * Antes este formulario mandaba con method="get" y solo aplicaba los
 * filtros al presionar "Filtrar" (navegación normal, sin JS). Ahora aplica
 * en tiempo real: cada cambio actualiza la URL (`router.replace`, no
 * `push`, para no llenar el historial de una entrada por letra escrita) y
 * eso vuelve a correr `listProductosPublicos` en el servidor -- ver
 * src/app/(public)/page.tsx. La búsqueda por texto lleva un debounce corto
 * para no disparar una consulta por cada tecla; los selects se aplican de
 * inmediato. `useTransition` deja que la escritura en el input se sienta
 * instantánea aunque la navegación (y la consulta a la base) tarde un
 * poco -- `pending` se usa para un aviso sutil de "Buscando…".
 */
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
  valores: ValoresFiltro;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [texto, setTexto] = useState(valores.q ?? "");
  const [tipo, setTipo] = useState(valores.tipo ?? "");
  const [categoria, setCategoria] = useState(valores.categoria ?? "");
  const [estilo, setEstilo] = useState(valores.estilo ?? "");
  const [acabado, setAcabado] = useState(valores.acabado ?? "");
  const [aplicacion, setAplicacion] = useState(valores.aplicacion ?? "");

  // Si los filtros aplicados de verdad cambian por fuera de esta misma
  // interacción (ej: el botón "atrás" del navegador, o alguien pega un
  // enlace con filtros ya en la URL), refleja esos valores acá -- si no,
  // este estado local se quedaría mostrando lo último que se escribió/
  // seleccionó aunque la URL (y los resultados) ya sean otros. Patrón
  // "ajustar estado durante el render" (sin useEffect, comparando contra
  // la última clave ya reflejada) -- mismo criterio que ya usa
  // Combobox.tsx para no pisar lo que la persona está escribiendo cuando
  // el cambio viene de afuera.
  const claveValores = JSON.stringify([
    valores.q ?? "",
    valores.tipo ?? "",
    valores.categoria ?? "",
    valores.estilo ?? "",
    valores.acabado ?? "",
    valores.aplicacion ?? "",
  ]);
  const [claveReflejada, setClaveReflejada] = useState(claveValores);
  if (claveValores !== claveReflejada) {
    setClaveReflejada(claveValores);
    setTexto(valores.q ?? "");
    setTipo(valores.tipo ?? "");
    setCategoria(valores.categoria ?? "");
    setEstilo(valores.estilo ?? "");
    setAcabado(valores.acabado ?? "");
    setAplicacion(valores.aplicacion ?? "");
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function aplicarFiltros(cambios: Partial<ValoresFiltro>) {
    const params = new URLSearchParams(searchParams.toString());
    const combinados = { tipo, categoria, estilo, acabado, aplicacion, q: texto, ...cambios };

    for (const [clave, valor] of Object.entries(combinados)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    // Cambiar cualquier filtro vuelve a la página 1 -- se estaría viendo
    // una página de resultados distintos a los que ahora aplican.
    params.delete("page");

    startTransition(() => {
      router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, {
        scroll: false,
      });
    });
  }

  function alCambiarTexto(valor: string) {
    setTexto(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => aplicarFiltros({ q: valor }), DEBOUNCE_BUSQUEDA_MS);
  }

  function limpiar() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setTexto("");
    setTipo("");
    setCategoria("");
    setEstilo("");
    setAcabado("");
    setAplicacion("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  const hayFiltrosActivos = Boolean(texto || tipo || categoria || estilo || acabado || aplicacion);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="q" className="text-sm font-medium text-piedra">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="search"
          value={texto}
          onChange={(e) => alCambiarTexto(e.target.value)}
          placeholder="Nombre o código"
          className={selectClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-sm font-medium text-piedra">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            aplicarFiltros({ tipo: e.target.value });
          }}
          className={selectClass}
        >
          <option value="">Todos</option>
          <option value="MOSAICO">Mosaico</option>
          <option value="MOLDURA">Moldura</option>
        </select>
      </div>

      {categorias.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="categoria" className="text-sm font-medium text-piedra">
            Categoría
          </label>
          <select
            id="categoria"
            name="categoria"
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              aplicarFiltros({ categoria: e.target.value });
            }}
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
          <label htmlFor="estilo" className="text-sm font-medium text-piedra">
            Diseño
          </label>
          <select
            id="estilo"
            name="estilo"
            value={estilo}
            onChange={(e) => {
              setEstilo(e.target.value);
              aplicarFiltros({ estilo: e.target.value });
            }}
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
          <label htmlFor="acabado" className="text-sm font-medium text-piedra">
            Acabado
          </label>
          <select
            id="acabado"
            name="acabado"
            value={acabado}
            onChange={(e) => {
              setAcabado(e.target.value);
              aplicarFiltros({ acabado: e.target.value });
            }}
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
          <label htmlFor="aplicacion" className="text-sm font-medium text-piedra">
            Aplicación
          </label>
          <select
            id="aplicacion"
            name="aplicacion"
            value={aplicacion}
            onChange={(e) => {
              setAplicacion(e.target.value);
              aplicarFiltros({ aplicacion: e.target.value });
            }}
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

      <div className="flex items-center gap-3">
        {pending && <span className="text-sm text-piedra">Buscando…</span>}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiar}
            className="flex items-center px-2 text-sm text-piedra underline"
          >
            Limpiar
          </button>
        )}
      </div>
    </form>
  );
}
