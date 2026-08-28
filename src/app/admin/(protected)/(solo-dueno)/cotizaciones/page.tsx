import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ETIQUETA_ESTADO_COTIZACION } from "@/lib/types";
import type { EstadoCotizacion } from "@/lib/types";

export const metadata = { title: "Cotizaciones — Panel administrativo" };

const ESTILO_ESTADO: Record<EstadoCotizacion, string> = {
  NUEVA: "bg-terracota/10 text-terracota-dark",
  CONTACTADO: "bg-amber-100 text-amber-800",
  CERRADA: "bg-neutral-100 text-neutral-600",
};

export default async function CotizacionesPage() {
  const solicitudes = await prisma.solicitudCotizacion.findMany({
    orderBy: { creadoEn: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Cotizaciones
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        {solicitudes.length}{" "}
        {solicitudes.length === 1 ? "solicitud" : "solicitudes"} recibidas
        desde el sitio público.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Recibida</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {solicitudes.map((solicitud) => (
              <tr key={solicitud.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {solicitud.nombreCliente}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {solicitud.telefono}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {solicitud._count.items}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILO_ESTADO[solicitud.estado as EstadoCotizacion]}`}
                  >
                    {ETIQUETA_ESTADO_COTIZACION[solicitud.estado as EstadoCotizacion]}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {solicitud.creadoEn.toLocaleDateString("es-HN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/cotizaciones/${solicitud.id}`}
                    className="font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
            {solicitudes.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  Todavía no hay solicitudes de cotización.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
