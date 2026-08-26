import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { EstadoBadge } from "@/components/admin/ui/EstadoBadge";
import { SelectorEstado } from "@/components/admin/ui/SelectorEstado";
import { CopiarBoton } from "@/components/admin/ui/CopiarBoton";
import { Tabs } from "@/components/admin/ui/Tabs";
import { EnviarWhatsAppModal } from "@/components/admin/EnviarWhatsAppModal";
import {
  formatearFechaHonduras,
  formatearFechaHoraHonduras,
  diasTranscurridosHonduras,
} from "@/lib/fecha";
import { mensajeConfirmacionPedido, mensajePedidoListo } from "@/lib/whatsapp";
import { SITE_URL } from "@/lib/site";
import {
  COLOR_ESTADO_PEDIDO,
  ETIQUETA_ESTADO_PEDIDO,
  COLOR_ESTADO_ENTREGA,
  ETIQUETA_ESTADO_ENTREGA,
  type EstadoPedido,
  type EstadoEntrega,
} from "@/lib/types";
import {
  asignarFechaPrometida,
  cambiarEstadoPedido,
  eliminarPedido,
  registrarRiego,
  crearEntrega,
  actualizarEstadoEntrega,
  eliminarEntrega,
} from "../actions";

export const metadata = { title: "Detalle de pedido — Panel administrativo" };

const ESTADOS: EstadoPedido[] = Object.keys(ETIQUETA_ESTADO_PEDIDO) as EstadoPedido[];
const ESTADOS_ENTREGA: EstadoEntrega[] = Object.keys(
  ETIQUETA_ESTADO_ENTREGA
) as EstadoEntrega[];

export default async function DetallePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      items: { include: { producto: { select: { nombre: true, sku: true } } } },
      historial: {
        orderBy: { creadoEn: "desc" },
        include: { adminUsuario: { select: { nombre: true } } },
      },
      riegos: {
        orderBy: { creadoEn: "desc" },
        include: { adminUsuario: { select: { nombre: true } } },
      },
      entregas: { orderBy: { creadoEn: "desc" } },
    },
  });

  if (!pedido) notFound();

  const linkTracker = `${SITE_URL}/estado-pedido/${pedido.codigo}`;
  const diasSecado = pedido.fechaInicioSecado
    ? diasTranscurridosHonduras(pedido.fechaInicioSecado)
    : null;

  const tabHistorial = (
    <ul className="divide-y divide-neutral-100">
      {pedido.historial.map((entrada) => (
        <li key={entrada.id} className="py-2.5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <EstadoBadge
              label={ETIQUETA_ESTADO_PEDIDO[entrada.estado as EstadoPedido]}
              colorClasses={COLOR_ESTADO_PEDIDO[entrada.estado as EstadoPedido]}
            />
            <span className="text-neutral-500">
              {formatearFechaHoraHonduras(entrada.creadoEn)} — {entrada.adminUsuario.nombre}
            </span>
          </div>
          {entrada.notas && (
            <p className="mt-1 text-neutral-600">{entrada.notas}</p>
          )}
        </li>
      ))}
      {pedido.historial.length === 0 && (
        <li className="py-4 text-center text-neutral-500">Sin historial todavía.</li>
      )}
    </ul>
  );

  const tabEntregas = (
    <div>
      <form
        action={crearEntrega.bind(null, pedido.id)}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="text-sm text-neutral-700">
          Fecha programada (opcional)
          <input
            type="date"
            name="fechaProgramada"
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <input
          name="notas"
          placeholder="Notas (opcional)"
          className="min-w-[180px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Programar entrega
        </button>
      </form>

      <ul className="mt-4 space-y-3">
        {pedido.entregas.map((entrega) => (
          <li key={entrega.id} className="rounded-lg border border-neutral-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm">
                <p className="font-medium text-neutral-900">
                  {entrega.fechaProgramada
                    ? `Programada: ${formatearFechaHonduras(entrega.fechaProgramada)}`
                    : "Sin fecha programada"}
                </p>
                {entrega.fechaReal && (
                  <p className="text-neutral-500">
                    Entregada el {formatearFechaHonduras(entrega.fechaReal)}
                  </p>
                )}
              </div>
              <EstadoBadge
                label={ETIQUETA_ESTADO_ENTREGA[entrega.estado as EstadoEntrega]}
                colorClasses={COLOR_ESTADO_ENTREGA[entrega.estado as EstadoEntrega]}
              />
            </div>
            {entrega.notas && (
              <p className="mt-1 text-sm text-neutral-600">{entrega.notas}</p>
            )}
            <form
              action={actualizarEstadoEntrega.bind(null, entrega.id)}
              className="mt-2 flex flex-wrap items-end gap-2"
            >
              <SelectorEstado
                nombre="estado"
                valorInicial={entrega.estado}
                opciones={ESTADOS_ENTREGA.map((estado) => ({
                  valor: estado,
                  etiqueta: ETIQUETA_ESTADO_ENTREGA[estado],
                  colorClasses: COLOR_ESTADO_ENTREGA[estado],
                }))}
              />
              <input
                name="notas"
                placeholder="Nota (opcional)"
                defaultValue={entrega.notas ?? ""}
                className="min-w-[160px] flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
              />
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Guardar
              </button>
            </form>
            <form action={eliminarEntrega.bind(null, entrega.id)} className="mt-2">
              <ConfirmSubmitButton
                confirmMessage="¿Borrar esta entrega programada? Esto no se puede deshacer."
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Borrar
              </ConfirmSubmitButton>
            </form>
          </li>
        ))}
        {pedido.entregas.length === 0 && (
          <li className="py-4 text-center text-sm text-neutral-500">
            Todavía no hay entregas programadas para este pedido.
          </li>
        )}
      </ul>
    </div>
  );

  const tabRiego = (
    <div>
      <form
        action={registrarRiego.bind(null, pedido.id)}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="flex-1 text-sm text-neutral-700">
          Observación (opcional)
          <input
            name="observacion"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Registrar riego de hoy
        </button>
      </form>
      <ul className="mt-4 divide-y divide-neutral-100">
        {pedido.riegos.map((riego) => (
          <li key={riego.id} className="py-2.5 text-sm">
            <span className="text-neutral-700">
              {formatearFechaHoraHonduras(riego.creadoEn)} — {riego.adminUsuario.nombre}
            </span>
            {riego.observacion && (
              <p className="mt-1 text-neutral-600">{riego.observacion}</p>
            )}
          </li>
        ))}
        {pedido.riegos.length === 0 && (
          <li className="py-4 text-center text-neutral-500">
            Todavía no se ha registrado ningún riego.
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <Link href="/admin/pedidos" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Pedidos
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Pedido #{pedido.codigo}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Recibido el {formatearFechaHoraHonduras(pedido.creadoEn)}
          </p>
        </div>
        <EstadoBadge
          label={ETIQUETA_ESTADO_PEDIDO[pedido.estado as EstadoPedido]}
          colorClasses={COLOR_ESTADO_PEDIDO[pedido.estado as EstadoPedido]}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <CopiarBoton
          valor={pedido.codigo}
          etiqueta="Copiar código"
          mensajeExito="Código copiado."
        />
        <CopiarBoton
          valor={linkTracker}
          etiqueta="Copiar enlace"
          mensajeExito="Enlace copiado."
        />
        <EnviarWhatsAppModal
          numero={pedido.cliente.telefono}
          tituloModal="Enviar confirmación de pedido"
          textoBoton="Enviar confirmación"
          mensajeInicial={mensajeConfirmacionPedido({
            nombreCliente: pedido.cliente.nombre,
            codigo: pedido.codigo,
            linkTracker,
          })}
        />
        {pedido.estado === "LISTO" && (
          <EnviarWhatsAppModal
            numero={pedido.cliente.telefono}
            tituloModal="Avisar que el pedido está listo"
            textoBoton="Avisar que está listo"
            mensajeInicial={mensajePedidoListo({
              nombreCliente: pedido.cliente.nombre,
              codigo: pedido.codigo,
              fecha: pedido.fechaPrometida
                ? formatearFechaHonduras(pedido.fechaPrometida)
                : "la fecha que te confirmemos",
            })}
          />
        )}
      </div>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Cliente</h2>
          <Link
            href={`/admin/clientes/${pedido.clienteId}`}
            className="mt-1 block font-medium text-neutral-900 hover:underline"
          >
            {pedido.cliente.nombre}
          </Link>
          <p className="text-sm text-neutral-600">{pedido.cliente.telefono}</p>
          {pedido.notas && (
            <p className="mt-2 text-sm text-neutral-600">
              <span className="text-neutral-500">Notas: </span>
              {pedido.notas}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Fechas</h2>
          <form
            action={asignarFechaPrometida.bind(null, pedido.id)}
            className="mt-1 flex flex-wrap items-end gap-2"
          >
            <label className="text-sm text-neutral-700">
              Fecha prometida
              <input
                type="date"
                name="fechaPrometida"
                defaultValue={
                  pedido.fechaPrometida
                    ? pedido.fechaPrometida.toISOString().slice(0, 10)
                    : ""
                }
                className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Guardar
            </button>
          </form>
          {pedido.fechaEntregaReal && (
            <p className="mt-2 text-sm text-neutral-600">
              Entregado el {formatearFechaHonduras(pedido.fechaEntregaReal)}
            </p>
          )}
          {diasSecado !== null && (
            <p className="mt-2 text-sm text-neutral-600">
              {diasSecado} {diasSecado === 1 ? "día" : "días"} de secado
            </p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Productos</h2>
        <ul className="mt-2 divide-y divide-neutral-100">
          {pedido.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-neutral-900">{item.producto.nombre}</p>
                <p className="text-xs text-neutral-500">
                  {[item.categoria, item.diseno, item.color].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right text-neutral-700">
                <p>
                  {item.cantidad.toString()} × L. {item.precioUnitario.toString()}
                </p>
                <p className="font-medium text-neutral-900">
                  L. {item.subtotal.toString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-neutral-50 p-3 text-sm">
          <div>
            <dt className="text-neutral-500">Total</dt>
            <dd className="font-semibold text-neutral-900">
              L. {pedido.montoTotal.toString()}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">
              Anticipo ({pedido.porcentajeAnticipo.toString()}%)
            </dt>
            <dd className="font-semibold text-neutral-900">
              L. {pedido.montoAnticipo.toString()}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Saldo</dt>
            <dd className="font-semibold text-neutral-900">
              L. {pedido.saldoPendiente.toString()}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Cambiar estado</h2>
        <form
          action={cambiarEstadoPedido.bind(null, pedido.id)}
          className="mt-2 flex flex-wrap items-end gap-2"
        >
          <SelectorEstado
            nombre="estado"
            valorInicial={pedido.estado}
            opciones={ESTADOS.map((estado) => ({
              valor: estado,
              etiqueta: ETIQUETA_ESTADO_PEDIDO[estado],
              colorClasses: COLOR_ESTADO_PEDIDO[estado],
            }))}
          />
          <input
            name="notas"
            placeholder="Nota opcional del cambio"
            className="min-w-[200px] flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Guardar
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <Tabs
          tabs={[
            { clave: "historial", etiqueta: "Historial", contenido: tabHistorial },
            { clave: "entregas", etiqueta: "Entregas", contenido: tabEntregas },
            { clave: "riego", etiqueta: "Riego", contenido: tabRiego },
          ]}
        />
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Borrar este pedido no se puede deshacer.
        </p>
        <form action={eliminarPedido.bind(null, pedido.id)} className="mt-3">
          <ConfirmSubmitButton
            confirmMessage={`¿Borrar el pedido #${pedido.codigo} para siempre? Esto no se puede deshacer.`}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Borrar pedido
          </ConfirmSubmitButton>
        </form>
      </section>
    </div>
  );
}
