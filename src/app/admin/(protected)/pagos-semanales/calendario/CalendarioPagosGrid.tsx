"use client";

import Link from "next/link";
import { useState } from "react";

export type PagoDetalle = {
  id: string;
  semana: string;
  estado: "PAGADO" | "PENDIENTE";
  totalProduccion: string;
  totalMezcla: string;
  totalExtras: string;
  totalGanado: string;
  montoPagado: string | null;
  fechaPago: string | null;
  notas: string | null;
};

export type EmpleadoDia = {
  empleadoId: string;
  nombre: string;
  estado: "PAGADO" | "PENDIENTE";
  pagos: PagoDetalle[];
};

type Celda = { clave: string; diaMes: number | null; empleados: EmpleadoDia[] };

const NOMBRES_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Seleccion = { diaTexto: string; empleado: EmpleadoDia };

export function CalendarioPagosGrid({
  nombreMesActual,
  mesAnterior,
  mesSiguiente,
  mesDeHoy,
  hoyClave,
  celdas,
}: {
  nombreMesActual: string;
  mesAnterior: string;
  mesSiguiente: string;
  mesDeHoy: string;
  hoyClave: string;
  celdas: Celda[];
}) {
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);

  return (
    <div>
      <Link
        href="/admin/pagos-semanales"
        className="text-sm font-medium text-neutral-500 hover:underline"
      >
        ← Pagos semanales
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Calendario de pagos</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/pagos-semanales/calendario?mes=${mesAnterior}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            ← Anterior
          </Link>
          <Link
            href={`/admin/pagos-semanales/calendario?mes=${mesDeHoy}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Hoy
          </Link>
          <Link
            href={`/admin/pagos-semanales/calendario?mes=${mesSiguiente}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Siguiente →
          </Link>
        </div>
      </div>

      <p className="mt-1 text-lg font-medium text-neutral-800">{nombreMesActual}</p>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Pagado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Generado, pendiente de pago
        </span>
      </div>

      <p className="mt-2 text-xs text-neutral-400">
        Haz click en un empleado para ver el detalle de ese pago. Para marcar pagado/pendiente o
        borrar, hazlo desde la tabla de Pagos semanales.
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
                      {celda.empleados.map((emp) => (
                        <button
                          key={emp.empleadoId}
                          type="button"
                          onClick={() =>
                            setSeleccion({
                              diaTexto: `${celda.diaMes} de ${nombreMesActual}`,
                              empleado: emp,
                            })
                          }
                          title={`${emp.nombre} — ${emp.estado === "PAGADO" ? "Pagado" : "Pendiente de pago"}`}
                          className={`truncate rounded border px-1.5 py-0.5 text-left text-[11px] font-medium hover:opacity-80 ${
                            emp.estado === "PAGADO"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {emp.nombre}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {seleccion && (
        <DetallePagoModal
          diaTexto={seleccion.diaTexto}
          empleado={seleccion.empleado}
          onCerrar={() => setSeleccion(null)}
        />
      )}
    </div>
  );
}

function DetallePagoModal({
  diaTexto,
  empleado,
  onCerrar,
}: {
  diaTexto: string;
  empleado: EmpleadoDia;
  onCerrar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="absolute inset-0"
        onClick={onCerrar}
        aria-hidden="true"
      />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">{diaTexto}</p>
            <h2 className="text-lg font-semibold text-neutral-900">{empleado.nombre}</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {empleado.pagos.map((pago) => (
            <div key={pago.id} className="rounded-md border border-neutral-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-neutral-900">Semana {pago.semana}</p>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    pago.estado === "PAGADO"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {pago.estado === "PAGADO" ? "Pagado" : "Pendiente"}
                </span>
              </div>

              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt className="text-neutral-500">Producción</dt>
                <dd className="text-right text-neutral-700">L. {pago.totalProduccion}</dd>
                <dt className="text-neutral-500">Mezcla</dt>
                <dd className="text-right text-neutral-700">L. {pago.totalMezcla}</dd>
                <dt className="text-neutral-500">Extras</dt>
                <dd className="text-right text-neutral-700">L. {pago.totalExtras}</dd>
                <dt className="font-medium text-neutral-900">Total</dt>
                <dd className="text-right font-semibold text-neutral-900">
                  L. {pago.totalGanado}
                </dd>
                {pago.estado === "PAGADO" && (
                  <>
                    <dt className="text-neutral-500">Monto pagado</dt>
                    <dd className="text-right text-neutral-700">
                      L. {pago.montoPagado ?? pago.totalGanado}
                    </dd>
                    <dt className="text-neutral-500">Fecha de pago</dt>
                    <dd className="text-right text-neutral-700">{pago.fechaPago}</dd>
                  </>
                )}
              </dl>

              {pago.notas && (
                <p className="mt-2 text-xs text-amber-600">{pago.notas}</p>
              )}
            </div>
          ))}
        </div>

        <Link
          href="/admin/pagos-semanales"
          className="mt-4 block text-center text-sm font-medium text-neutral-600 hover:underline"
        >
          Ver en la tabla de Pagos semanales →
        </Link>
      </div>
    </div>
  );
}
