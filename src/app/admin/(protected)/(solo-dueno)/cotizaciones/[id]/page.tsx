import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WhatsAppButton } from "@/components/catalogo/WhatsAppButton";
import { ETIQUETA_UNIDAD } from "@/lib/types";
import type { UnidadCotizacion, EstadoCotizacion } from "@/lib/types";
import { EstadoCotizacionForm } from "../EstadoCotizacionForm";
import { EliminarCotizacionForm } from "../EliminarCotizacionForm";

export const metadata = { title: "Detalle de cotización — Panel administrativo" };

export default async function DetalleCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const solicitud = await prisma.solicitudCotizacion.findUnique({
    where: { id },
    include: {
      items: {
        include: { producto: { select: { nombre: true, slug: true, sku: true } } },
      },
    },
  });

  if (!solicitud) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/cotizaciones"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Cotizaciones
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        {solicitud.nombreCliente}
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Recibida el{" "}
        {solicitud.creadoEn.toLocaleDateString("es-HN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Datos de contacto
        </h2>
        <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Teléfono</dt>
            <dd className="text-neutral-900">{solicitud.telefono}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Correo</dt>
            <dd className="text-neutral-900">{solicitud.email ?? "—"}</dd>
          </div>
          {solicitud.notas && (
            <div className="sm:col-span-2">
              <dt className="text-neutral-500">Notas del cliente</dt>
              <dd className="text-neutral-900">{solicitud.notas}</dd>
            </div>
          )}
        </dl>
        <div className="mt-4">
          <WhatsAppButton
            numero={solicitud.telefono}
            mensaje={`Hola ${solicitud.nombreCliente}, te escribimos de La Mera Fábrica sobre tu solicitud de cotización.`}
          >
            Responder por WhatsApp
          </WhatsAppButton>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Productos solicitados
        </h2>
        <ul className="mt-2 divide-y divide-neutral-100">
          {solicitud.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-neutral-900">
                {item.producto.nombre}
                {item.producto.sku && (
                  <span className="ml-2 text-xs text-neutral-400">
                    ({item.producto.sku})
                  </span>
                )}
              </span>
              <span className="text-neutral-600">
                {item.cantidad != null
                  ? `${item.cantidad.toString()} ${ETIQUETA_UNIDAD[item.unidad as UnidadCotizacion]}`
                  : "Cantidad por confirmar"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Estado</h2>
        <EstadoCotizacionForm
          id={solicitud.id}
          estadoActual={solicitud.estado as EstadoCotizacion}
        />
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Borrar esta cotización no se puede deshacer.
        </p>
        <EliminarCotizacionForm id={solicitud.id} />
      </section>
    </div>
  );
}
