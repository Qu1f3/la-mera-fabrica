import { prisma } from "@/lib/prisma";
import {
  claveDiaHonduras,
  formatearFechaHonduras,
  grillaMesHonduras,
  mesAdyacente,
  rangoMesHonduras,
} from "@/lib/fecha";
import { CalendarioPagosGrid, type EmpleadoDia, type PagoDetalle } from "./CalendarioPagosGrid";

export const metadata = { title: "Calendario de pagos — Panel administrativo" };

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

function fechaCorta(fecha: Date): string {
  return formatearFechaHonduras(fecha, { day: "2-digit", month: "short" });
}

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
      totalProduccion: true,
      totalMezcla: true,
      totalExtras: true,
      totalGanado: true,
      montoPagado: true,
      fechaPago: true,
      notas: true,
      empleado: { select: { nombre: true } },
    },
    orderBy: { empleado: { nombre: "asc" } },
  });

  // Un día -> empleado -> { estado resumen (para el color del badge, PAGADO
  // gana sobre PENDIENTE), y la lista de TODOS los pagos de ese empleado
  // que cubren ese día (puede haber más de uno -- ej. un pago suelto de un
  // día dentro de una semana que también se generó, ver nota en
  // generarPagoSemanal). El detalle al hacer click muestra la lista
  // completa, no solo el resumen.
  const porDia = new Map<string, Map<string, EmpleadoDia>>();
  for (const pago of pagos) {
    const detalle: PagoDetalle = {
      id: pago.id,
      semana: `${fechaCorta(pago.semanaInicio)} – ${fechaCorta(pago.semanaFin)}`,
      estado: pago.estado as "PAGADO" | "PENDIENTE",
      totalProduccion: Number(pago.totalProduccion).toFixed(2),
      totalMezcla: Number(pago.totalMezcla).toFixed(2),
      totalExtras: Number(pago.totalExtras).toFixed(2),
      totalGanado: Number(pago.totalGanado).toFixed(2),
      montoPagado: pago.montoPagado ? Number(pago.montoPagado).toFixed(2) : null,
      fechaPago: pago.fechaPago ? fechaCorta(pago.fechaPago) : null,
      notas: pago.notas,
    };

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
      if (!previo) {
        empleadosDelDia.set(pago.empleadoId, {
          empleadoId: pago.empleadoId,
          nombre: pago.empleado.nombre,
          estado: detalle.estado,
          pagos: [detalle],
        });
      } else {
        empleadosDelDia.set(pago.empleadoId, {
          ...previo,
          estado: previo.estado === "PAGADO" ? "PAGADO" : detalle.estado,
          pagos: [...previo.pagos, detalle],
        });
      }
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  const celdas = grillaMesHonduras(mesActual).map((celda) => ({
    ...celda,
    empleados: celda.clave ? Array.from(porDia.get(celda.clave)?.values() ?? []) : [],
  }));

  const hoyClave = claveDiaHonduras(new Date());
  const mesAnterior = mesAdyacente(mesActual, -1);
  const mesSiguiente = mesAdyacente(mesActual, 1);
  const mesDeHoy = claveDiaHonduras(new Date()).slice(0, 7);

  return (
    <CalendarioPagosGrid
      nombreMesActual={nombreMes(mesActual)}
      mesAnterior={mesAnterior}
      mesSiguiente={mesSiguiente}
      mesDeHoy={mesDeHoy}
      hoyClave={hoyClave}
      celdas={celdas}
    />
  );
}
