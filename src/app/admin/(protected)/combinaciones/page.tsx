import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Combinaciones de mosaico — Panel administrativo" };

type ComponenteResumen = {
  id: string;
  nombre: string;
  cementoCantidad: unknown;
  cementoUnidad: string | null;
  cementoTipo: string | null;
  coloranteColor: string | null;
  coloranteCantidad: unknown;
  coloranteUnidad: string | null;
  notas: string | null;
};

function Etiqueta({ tono, children }: { tono: "gris" | "ambar"; children: React.ReactNode }) {
  const clases =
    tono === "ambar"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-neutral-200 bg-neutral-100 text-neutral-700";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${clases}`}
    >
      {children}
    </span>
  );
}

/**
 * Una fila por componente (capa) de la combinación, con el cemento y el
 * colorante como etiquetas -- antes era una sola línea de texto plano tipo
 * "Fondo Rojo (cemento gris 42.5kg + colorante rojo 6lb); Pringa Negra
 * (...)" que se leía como un volcado de datos crudo; el usuario pidió que
 * se viera más cuidado (2026-09-03).
 */
function FilaComponente({ componente }: { componente: ComponenteResumen }) {
  const hayCemento = componente.cementoCantidad !== null && componente.cementoCantidad !== undefined;
  const hayColorante = Boolean(componente.coloranteColor);

  return (
    <div className="rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
      <p className="text-sm font-medium text-neutral-800">{componente.nombre}</p>
      {(hayCemento || hayColorante) && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {hayCemento && (
            <Etiqueta tono="gris">
              Cemento {componente.cementoTipo === "blanco" ? "blanco" : "gris"} ·{" "}
              {String(componente.cementoCantidad)} {componente.cementoUnidad}
            </Etiqueta>
          )}
          {hayColorante && (
            <Etiqueta tono="ambar">
              Colorante {componente.coloranteColor}
              {componente.coloranteCantidad !== null && componente.coloranteCantidad !== undefined
                ? ` · ${String(componente.coloranteCantidad)} ${componente.coloranteUnidad}`
                : " (cantidad variable)"}
            </Etiqueta>
          )}
        </div>
      )}
      {componente.notas && <p className="mt-1.5 text-xs text-neutral-400">{componente.notas}</p>}
    </div>
  );
}

/**
 * Catálogo de referencia "cuánto cemento + colorante lleva cada mosaico" --
 * pedido por el usuario 2026-09-03. Es solo informativo: no descuenta
 * inventario ni se conecta con Producción, a propósito (ver actions.ts).
 * Visible y editable tanto para ADMIN como EMPLEADO -- decisión explícita
 * del usuario, igual que Producción/Inventario.
 */
export default async function CombinacionesPage() {
  const combinaciones = await prisma.combinacionMosaico.findMany({
    include: {
      producto: { select: { nombre: true, sku: true } },
      componentes: { orderBy: { orden: "asc" } },
    },
    orderBy: { producto: { nombre: "asc" } },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Combinaciones de mosaico</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Cuánto cemento y colorante lleva cada mosaico -- solo de referencia, no afecta el
            inventario.
          </p>
        </div>
        <Link
          href="/admin/combinaciones/nueva"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Nueva combinación
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {combinaciones.map((combinacion) => (
          <Link
            key={combinacion.id}
            href={`/admin/combinaciones/${combinacion.id}`}
            className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:bg-neutral-50"
          >
            <p className="font-medium text-neutral-900">
              {combinacion.producto.nombre}
              {combinacion.producto.sku && (
                <span className="ml-1.5 text-xs font-normal text-neutral-400">
                  ({combinacion.producto.sku})
                </span>
              )}
            </p>
            <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {combinacion.componentes.map((componente) => (
                <FilaComponente key={componente.id} componente={componente} />
              ))}
            </div>
            {combinacion.notas && (
              <p className="mt-2 text-xs text-neutral-400">{combinacion.notas}</p>
            )}
          </Link>
        ))}
        {combinaciones.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            Todavía no hay combinaciones registradas.
          </p>
        )}
      </div>
    </div>
  );
}
