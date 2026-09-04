import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Existencia de mosaico — Panel administrativo" };

/**
 * Cuánto hay en bodega de cada mosaico terminado -- pedido por el usuario
 * 2026-09-04, a propósito INDEPENDIENTE de Producción/Inventario: es solo un
 * número que se actualiza a mano cuando se hace un conteo físico, nada lo
 * descuenta ni lo suma automáticamente. Visible y editable tanto para ADMIN
 * como EMPLEADO -- misma convención que Producción/Combinaciones.
 */
export default async function ExistenciaPage() {
  const existencias = await prisma.existenciaMosaico.findMany({
    include: { producto: { select: { nombre: true, sku: true } } },
    orderBy: { producto: { nombre: "asc" } },
  });

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Existencia de mosaico</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Cuánto hay en bodega de cada mosaico -- se actualiza a mano, no está conectado con
            producción ni con inventario.
          </p>
        </div>
        <Link
          href="/admin/existencia/nueva"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Registrar existencia
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {existencias.map((existencia) => (
          <Link
            key={existencia.id}
            href={`/admin/existencia/${existencia.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:bg-neutral-50"
          >
            <div>
              <p className="font-medium text-neutral-900">
                {existencia.producto.nombre}
                {existencia.producto.sku && (
                  <span className="ml-1.5 text-xs font-normal text-neutral-400">
                    ({existencia.producto.sku})
                  </span>
                )}
              </p>
              {existencia.notas && (
                <p className="mt-1 text-xs text-neutral-400">{existencia.notas}</p>
              )}
            </div>
            <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-800">
              {existencia.cantidad}
            </span>
          </Link>
        ))}
        {existencias.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            Todavía no hay existencia registrada.
          </p>
        )}
      </div>
    </div>
  );
}
