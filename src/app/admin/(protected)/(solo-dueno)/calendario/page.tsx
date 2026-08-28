import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  claveDiaHonduras,
  grillaMesHonduras,
  mesAdyacente,
  rangoMesHonduras,
} from "@/lib/fecha";
import {
  COLOR_ESTADO_PEDIDO,
  COLOR_ESTADO_ENTREGA,
  type EstadoPedido,
  type EstadoEntrega,
} from "@/lib/types";

export const metadata = { title: "Calendario — Panel administrativo" };

const NOMBRES_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function nombreMes(mesTexto: string): string {
  const [anio, mes] = mesTexto.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, 1));
  const texto = fecha.toLocaleDateString("es-HN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesValido = mes && /^\d{4}-\d{2}$/.test(mes);
  const mesActual = mesValido ? mes! : claveDiaHonduras(new Date()).slice(0, 7);

  const { inicio, fin } = rangoMesHonduras(mesActual);

  const [pedidos, entregas] = await Promise.all([
    prisma.pedido.findMany({
      where: { fechaPrometida: { gte: inicio, lt: fin } },
      select: {
        id: true,
        codigo: true,
        estado: true,
        fechaPrometida: true,
        cliente: { select: { nombre: true } },
      },
      orderBy: { fechaPrometida: "asc" },
    }),
    prisma.entrega.findMany({
      where: { fechaProgramada: { gte: inicio, lt: fin } },
      select: {
        id: true,
        estado: true,
        fechaProgramada: true,
        pedido: { select: { id: true, codigo: true, cliente: { select: { nombre: true } } } },
      },
      orderBy: { fechaProgramada: "asc" },
    }),
  ]);

  const pedidosPorDia = new Map<string, typeof pedidos>();
  for (const pedido of pedidos) {
    if (!pedido.fechaPrometida) continue;
    const clave = claveDiaHonduras(pedido.fechaPrometida);
    pedidosPorDia.set(clave, [...(pedidosPorDia.get(clave) ?? []), pedido]);
  }

  const entregasPorDia = new Map<string, typeof entregas>();
  for (const entrega of entregas) {
    if (!entrega.fechaProgramada) continue;
    const clave = claveDiaHonduras(entrega.fechaProgramada);
    entregasPorDia.set(clave, [...(entregasPorDia.get(clave) ?? []), entrega]);
  }

  const celdas = grillaMesHonduras(mesActual);
  const hoyClave = claveDiaHonduras(new Date());
  const mesAnterior = mesAdyacente(mesActual, -1);
  const mesSiguiente = mesAdyacente(mesActual, 1);
  const mesDeHoy = claveDiaHonduras(new Date()).slice(0, 7);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Calendario</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/calendario?mes=${mesAnterior}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            ← Anterior
          </Link>
          <Link
            href={`/admin/calendario?mes=${mesDeHoy}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Hoy
          </Link>
          <Link
            href={`/admin/calendario?mes=${mesSiguiente}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Siguiente →
          </Link>
        </div>
      </div>

      <p className="mt-1 text-lg font-medium text-neutral-800">{nombreMes(mesActual)}</p>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-400" /> Fecha prometida de un pedido
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400" /> Entrega programada
        </span>
      </div>

      <p className="mt-2 text-xs text-neutral-400">
        Para reprogramar, edita la fecha del pedido o de la entrega desde su detalle -- este
        calendario todavía no permite arrastrar y soltar.
      </p>

      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[820px] grid-cols-7 gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200">
          {NOMBRES_DIA.map((nombre) => (
            <div
              key={nombre}
              className="bg-neutral-50 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              {nombre}
            </div>
          ))}
          {celdas.map((celda, indice) => {
            const pedidosDelDia = celda.clave ? pedidosPorDia.get(celda.clave) ?? [] : [];
            const entregasDelDia = celda.clave ? entregasPorDia.get(celda.clave) ?? [] : [];
            const esHoy = celda.clave === hoyClave;
            return (
              <div
                key={indice}
                className={`min-h-[110px] bg-white p-1.5 align-top ${
                  celda.diaMes === null ? "bg-neutral-50" : ""
                }`}
              >
                {celda.diaMes !== null && (
                  <>
                    <p
                      className={`text-xs font-medium ${
                        esHoy
                          ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white"
                          : "text-neutral-500"
                      }`}
                    >
                      {celda.diaMes}
                    </p>
                    <div className="mt-1 flex flex-col gap-1">
                      {pedidosDelDia.map((pedido) => (
                        <Link
                          key={pedido.id}
                          href={`/admin/pedidos/${pedido.id}`}
                          title={`${pedido.codigo} — ${pedido.cliente.nombre}`}
                          className={`truncate rounded border px-1.5 py-0.5 text-[11px] font-medium hover:opacity-80 ${
                            COLOR_ESTADO_PEDIDO[pedido.estado as EstadoPedido]
                          }`}
                        >
                          {pedido.codigo}
                        </Link>
                      ))}
                      {entregasDelDia.map((entrega) => (
                        <Link
                          key={entrega.id}
                          href={`/admin/pedidos/${entrega.pedido.id}`}
                          title={`Entrega — ${entrega.pedido.codigo} — ${entrega.pedido.cliente.nombre}`}
                          className={`truncate rounded border px-1.5 py-0.5 text-[11px] font-medium hover:opacity-80 ${
                            COLOR_ESTADO_ENTREGA[entrega.estado as EstadoEntrega]
                          }`}
                        >
                          📦 {entrega.pedido.codigo}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
