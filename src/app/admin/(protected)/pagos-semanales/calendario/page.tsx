import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  claveDiaHonduras,
  grillaMesHonduras,
  mesAdyacente,
  rangoMesHonduras,
} from "@/lib/fecha";

export const metadata = { title: "Calendario de pagos — Panel administrativo" };

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

type EmpleadoDelDia = { nombre: string; estado: "PAGADO" | "PENDIENTE" };

export default async function CalendarioPagosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesValido = mes && /^\d{4}-\d{2}$/.test(mes);
  const mesActual = mesValido ? mes! : claveDiaHonduras(new Date()).slice(0, 7);

  const { inicio, fin } = rangoMesHonduras(mesActual);

  // Cualquier pago cuyo rango [semanaInicio, semanaFin] se cruce con el mes
  // que se está mostrando -- mismo criterio de cruce que generarPagoSemanal
  // en pagos-semanales/actions.ts.
  const pagos = await prisma.pagoEmpleado.findMany({
    where: { semanaInicio: { lt: fin }, semanaFin: { gte: inicio } },
    select: {
      id: true,
      empleadoId: true,
      semanaInicio: true,
      semanaFin: true,
      estado: true,
      empleado: { select: { nombre: true } },
    },
    orderBy: { empleado: { nombre: "asc" } },
  });

  // Un día -> empleado -> estado. Si CUALQUIER pago de ese empleado que
  // cubre el día está PAGADO, el día cuenta como pagado para ese empleado
  // (puede haber un pago de la semana completa que excluyó ese día del
  // monto -- ver nota en generarPagoSemanal -- y aun así el día quedó
  // cubierto y pagado por el registro suelto).
  const porDia = new Map<string, Map<string, EmpleadoDelDia>>();
  for (const pago of pagos) {
    let cursor = new Date(pago.semanaInicio);
    const limite = pago.semanaFin;
    while (cursor <= limite) {
      const clave = claveDiaHonduras(cursor);
      let empleadosDelDia = porDia.get(clave);
      if (!empleadosDelDia) {
        empleadosDelDia = new Map();
        porDia.set(clave, empleadosDelDia);
      }
      const previo = empleadosDelDia.get(pago.empleadoId);
      if (!previo || (previo.estado === "PENDIENTE" && pago.estado === "PAGADO")) {
        empleadosDelDia.set(pago.empleadoId, {
          nombre: pago.empleado.nombre,
          estado: pago.estado as "PAGADO" | "PENDIENTE",
        });
      }
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  const celdas = grillaMesHonduras(mesActual);
  const hoyClave = claveDiaHonduras(new Date());
  const mesAnterior = mesAdyacente(mesActual, -1);
  const mesSiguiente = mesAdyacente(mesActual, 1);
  const mesDeHoy = claveDiaHonduras(new Date()).slice(0, 7);

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

      <p className="mt-1 text-lg font-medium text-neutral-800">{nombreMes(mesActual)}</p>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Pagado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Generado, pendiente de pago
        </span>
      </div>

      <p className="mt-2 text-xs text-neutral-400">
        Cada día muestra los empleados cuyo pago (semanal o de un solo día) cubre esa fecha. Para
        generar o marcar un pago, hazlo desde la tabla de Pagos semanales.
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
            const empleadosDelDia = celda.clave
              ? Array.from(porDia.get(celda.clave)?.values() ?? [])
              : [];
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
                      {empleadosDelDia.map((emp) => (
                        <span
                          key={emp.nombre}
                          title={`${emp.nombre} — ${emp.estado === "PAGADO" ? "Pagado" : "Pendiente de pago"}`}
                          className={`truncate rounded border px-1.5 py-0.5 text-[11px] font-medium ${
                            emp.estado === "PAGADO"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {emp.nombre}
                        </span>
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
