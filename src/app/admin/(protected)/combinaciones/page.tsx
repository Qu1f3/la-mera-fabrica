import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Combinaciones de mosaico — Panel administrativo" };

function resumenComponente(c: {
  nombre: string;
  cementoCantidad: unknown;
  cementoUnidad: string | null;
  coloranteColor: string | null;
  coloranteCantidad: unknown;
  coloranteUnidad: string | null;
}) {
  const partes: string[] = [];
  if (c.cementoCantidad !== null && c.cementoCantidad !== undefined) {
    partes.push(`cemento ${String(c.cementoCantidad)}${c.cementoUnidad ?? ""}`);
  }
  if (c.coloranteColor) {
    partes.push(
      c.coloranteCantidad !== null && c.coloranteCantidad !== undefined
        ? `colorante ${c.coloranteColor} ${String(c.coloranteCantidad)}${c.coloranteUnidad ?? ""}`
        : `colorante ${c.coloranteColor} (variable)`
    );
  }
  if (partes.length === 0) return c.nombre;
  return `${c.nombre} (${partes.join(" + ")})`;
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
            <p className="mt-1 text-sm text-neutral-600">
              {combinacion.componentes.map(resumenComponente).join("; ")}
            </p>
            {combinacion.notas && (
              <p className="mt-1 text-xs text-neutral-400">{combinacion.notas}</p>
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
