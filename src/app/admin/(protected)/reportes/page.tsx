import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { claveDiaHonduras, mesAdyacente, rangoMesHonduras } from "@/lib/fecha";
import { ETIQUETA_TIPO_GASTO, ETIQUETA_TIPO_INGRESO, type TipoGasto, type TipoIngreso } from "@/lib/types";

export const metadata = { title: "Reportes — Panel administrativo" };

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

function nombreMesCorto(mesTexto: string): string {
  const [anio, mes] = mesTexto.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, 1));
  const texto = fecha.toLocaleDateString("es-HN", { month: "short", timeZone: "UTC" });
  return (texto.charAt(0).toUpperCase() + texto.slice(1)).replace(".", "");
}

function claveMesDe(fecha: Date): string {
  return claveDiaHonduras(fecha).slice(0, 7);
}

// --- Estilo visual compartido de la página ------------------------------
// Una sola vez: animación de entrada (tarjetas/gráficos aparecen con un
// pequeño desvanecido + deslizamiento, escalonados por índice) y el estado
// de hover de las barras de los gráficos. CSS puro, sin JS ni librerías --
// mismo criterio que el resto del kit de UI del panel.
function EstiloReportes() {
  return (
    <style>{`
      @keyframes reportesAparecer {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .reportes-aparece { animation: reportesAparecer 0.45s ease-out both; }
      .reportes-barra {
        transition: opacity 0.15s ease, filter 0.15s ease;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.08));
      }
      .reportes-barra:hover {
        opacity: 0.82;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.16));
      }
    `}</style>
  );
}

function Tarjeta({
  titulo,
  filas,
  color = "#a3a3a3",
  retraso = 0,
}: {
  titulo: string;
  filas: { etiqueta: string; valor: string }[];
  color?: string;
  retraso?: number;
}) {
  return (
    <div
      className="reportes-aparece rounded-xl border border-neutral-200 border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderLeftColor: color, animationDelay: `${retraso}ms` }}
    >
      <h2 className="text-sm font-semibold text-neutral-900">{titulo}</h2>
      <dl className="mt-3 space-y-2">
        {filas.map((fila) => (
          <div key={fila.etiqueta} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-neutral-500">{fila.etiqueta}</dt>
            <dd className="font-medium text-neutral-900">{fila.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// --- Gráficos y tarjetas de estadística (SVG a mano, sin librerías
// externas -- mismo criterio que el resto del kit de UI del panel).
// Paleta y reglas tomadas de la guía interna de dataviz: colores
// categóricos en orden fijo (azul=Ingresos, naranja=Gastos, consistente en
// toda la página), un solo eje, leyenda cuando hay 2+ series, valores en
// <title> para hover nativo sin JS, degradados + sombra para dar
// profundidad, y solo se etiqueta el mes más reciente (no cada barra) para
// no saturar el gráfico.

type MesTendencia = {
  clave: string;
  etiqueta: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
};

type CategoriaMonto = { clave: string; etiqueta: string; monto: number };

const COLOR_INGRESOS = "#2a78d6";
const COLOR_GASTOS = "#eb6834";
const COLOR_GANANCIA = "#2a78d6";
const COLOR_PERDIDA = "#e34948";
const COLOR_VENTAS = "#2a78d6";
const COLOR_PRODUCCION = "#4a3aa7";
const COLOR_PAGOS = "#eda100";
const COLOR_INVENTARIO = "#1baf7a";

const ANCHO_GRAFICO = 640;
const ALTO_GRAFICO = 220;
const MARGEN = { arriba: 16, derecha: 12, abajo: 28, izquierda: 52 };
const AREA_ANCHO = ANCHO_GRAFICO - MARGEN.izquierda - MARGEN.derecha;
const AREA_ALTO = ALTO_GRAFICO - MARGEN.arriba - MARGEN.abajo;

function redondearEscala(valor: number): number {
  if (valor <= 0) return 100;
  const magnitud = Math.pow(10, Math.floor(Math.log10(valor)));
  const normalizado = valor / magnitud;
  let base = 10;
  if (normalizado <= 1) base = 1;
  else if (normalizado <= 2) base = 2;
  else if (normalizado <= 5) base = 5;
  return base * magnitud;
}

function formatoCompacto(valor: number): string {
  return Math.round(valor).toLocaleString("es-HN");
}

function formatoLempiras(valor: number): string {
  return `L. ${Math.round(valor).toLocaleString("es-HN")}`;
}

function calcularDelta(actual: number, anterior: number): { texto: string; positivo: boolean } | null {
  if (anterior === 0) {
    if (actual === 0) return null;
    return { texto: "nuevo", positivo: actual > 0 };
  }
  const cambio = ((actual - anterior) / Math.abs(anterior)) * 100;
  const signo = cambio >= 0 ? "+" : "";
  return { texto: `${signo}${cambio.toFixed(0)}%`, positivo: cambio >= 0 };
}

function Sparkline({ valores, color }: { valores: number[]; color: string }) {
  const ANCHO = 88;
  const ALTO = 28;
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const rango = max - min || 1;
  const paso = valores.length > 1 ? ANCHO / (valores.length - 1) : 0;
  const puntos = valores
    .map((v, i) => {
      const x = i * paso;
      const y = ALTO - ((v - min) / rango) * ALTO;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const ultimoValor = valores[valores.length - 1];
  const ultimoX = (valores.length - 1) * paso;
  const ultimoY = ALTO - ((ultimoValor - min) / rango) * ALTO;

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="h-7 w-24 shrink-0" role="img" aria-hidden="true">
      <polyline
        points={puntos}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ultimoX} cy={ultimoY} r={2.5} fill={color} />
    </svg>
  );
}

function TarjetaStat({
  titulo,
  valor,
  subtitulo,
  delta,
  colorDelta,
  color,
  tendencia,
  retraso = 0,
}: {
  titulo: string;
  valor: string;
  subtitulo?: string;
  delta: { texto: string; positivo: boolean } | null;
  colorDelta: (positivo: boolean) => "bueno" | "malo";
  color: string;
  tendencia: number[];
  retraso?: number;
}) {
  const veredicto = delta ? colorDelta(delta.positivo) : null;
  return (
    <div
      className="reportes-aparece rounded-xl border border-neutral-200 border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderLeftColor: color, animationDelay: `${retraso}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{titulo}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-neutral-900">{valor}</p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            {delta && (
              <span
                className={`font-medium ${
                  veredicto === "bueno" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {delta.positivo ? "▲" : "▼"} {delta.texto}
              </span>
            )}
            {subtitulo && <span className="text-neutral-400">{subtitulo}</span>}
          </div>
        </div>
        <Sparkline valores={tendencia} color={color} />
      </div>
    </div>
  );
}

function GraficoTendenciaFinanzas({ meses }: { meses: MesTendencia[] }) {
  const maxValor = Math.max(1, ...meses.flatMap((m) => [m.ingresos, m.gastos]));
  const escala = redondearEscala(maxValor);
  const ticks = [0, escala * 0.25, escala * 0.5, escala * 0.75, escala];
  const bandaAncho = AREA_ANCHO / meses.length;
  const barraAncho = Math.min(20, bandaAncho * 0.28);
  const separacion = 4;

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${ANCHO_GRAFICO} ${ALTO_GRAFICO}`}
          className="w-full min-w-[480px]"
          role="img"
          aria-label="Ingresos y gastos por mes, últimos 6 meses"
        >
          <defs>
            <linearGradient id="gradTendenciaIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_INGRESOS} stopOpacity={1} />
              <stop offset="100%" stopColor={COLOR_INGRESOS} stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="gradTendenciaGastos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_GASTOS} stopOpacity={1} />
              <stop offset="100%" stopColor={COLOR_GASTOS} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          {ticks.map((tick) => {
            const y = MARGEN.arriba + AREA_ALTO - (tick / escala) * AREA_ALTO;
            return (
              <g key={tick}>
                <line
                  x1={MARGEN.izquierda}
                  x2={ANCHO_GRAFICO - MARGEN.derecha}
                  y1={y}
                  y2={y}
                  stroke="#e5e5e5"
                  strokeWidth={1}
                />
                <text x={MARGEN.izquierda - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#737373">
                  {tick === 0 ? "0" : formatoCompacto(tick)}
                </text>
              </g>
            );
          })}
          {meses.map((mes, i) => {
            const bandaX = MARGEN.izquierda + i * bandaAncho;
            const centroX = bandaX + bandaAncho / 2;
            const xIngreso = centroX - separacion / 2 - barraAncho;
            const xGasto = centroX + separacion / 2;
            const altoIngreso = (mes.ingresos / escala) * AREA_ALTO;
            const altoGasto = (mes.gastos / escala) * AREA_ALTO;
            const yIngreso = MARGEN.arriba + AREA_ALTO - altoIngreso;
            const yGasto = MARGEN.arriba + AREA_ALTO - altoGasto;
            const esUltimo = i === meses.length - 1;
            return (
              <g key={mes.clave}>
                <rect
                  className="reportes-barra"
                  x={xIngreso}
                  y={yIngreso}
                  width={barraAncho}
                  height={Math.max(altoIngreso, 0)}
                  rx={4}
                  fill="url(#gradTendenciaIngresos)"
                >
                  <title>{`${mes.etiqueta} — Ingresos: ${formatoLempiras(mes.ingresos)}`}</title>
                </rect>
                <rect
                  className="reportes-barra"
                  x={xGasto}
                  y={yGasto}
                  width={barraAncho}
                  height={Math.max(altoGasto, 0)}
                  rx={4}
                  fill="url(#gradTendenciaGastos)"
                >
                  <title>{`${mes.etiqueta} — Gastos: ${formatoLempiras(mes.gastos)}`}</title>
                </rect>
                {esUltimo && (
                  <>
                    <text x={xIngreso + barraAncho / 2} y={yIngreso - 4} textAnchor="middle" fontSize={9} fontWeight={600} fill="#171717">
                      {formatoCompacto(mes.ingresos)}
                    </text>
                    <text x={xGasto + barraAncho / 2} y={yGasto - 4} textAnchor="middle" fontSize={9} fontWeight={600} fill="#171717">
                      {formatoCompacto(mes.gastos)}
                    </text>
                  </>
                )}
                <text
                  x={centroX}
                  y={ALTO_GRAFICO - MARGEN.abajo + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#737373"
                >
                  {mes.etiqueta}
                </text>
              </g>
            );
          })}
          <line
            x1={MARGEN.izquierda}
            x2={ANCHO_GRAFICO - MARGEN.derecha}
            y1={MARGEN.arriba + AREA_ALTO}
            y2={MARGEN.arriba + AREA_ALTO}
            stroke="#a3a3a3"
            strokeWidth={1}
          />
        </svg>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR_INGRESOS }} />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR_GASTOS }} />
          Gastos
        </span>
      </div>
    </div>
  );
}

function GraficoUtilidad({ meses }: { meses: MesTendencia[] }) {
  const maxAbs = Math.max(1, ...meses.map((m) => Math.abs(m.utilidad)));
  const escala = redondearEscala(maxAbs);
  const centroY = MARGEN.arriba + AREA_ALTO / 2;
  const bandaAncho = AREA_ANCHO / meses.length;
  const barraAncho = Math.min(24, bandaAncho * 0.4);

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${ANCHO_GRAFICO} ${ALTO_GRAFICO}`}
          className="w-full min-w-[480px]"
          role="img"
          aria-label="Utilidad por mes, últimos 6 meses"
        >
          <defs>
            <linearGradient id="gradGanancia" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_GANANCIA} stopOpacity={1} />
              <stop offset="100%" stopColor={COLOR_GANANCIA} stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="gradPerdida" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={COLOR_PERDIDA} stopOpacity={1} />
              <stop offset="100%" stopColor={COLOR_PERDIDA} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <line
            x1={MARGEN.izquierda}
            x2={ANCHO_GRAFICO - MARGEN.derecha}
            y1={centroY}
            y2={centroY}
            stroke="#a3a3a3"
            strokeWidth={1}
          />
          {meses.map((mes, i) => {
            const bandaX = MARGEN.izquierda + i * bandaAncho;
            const centroX = bandaX + bandaAncho / 2;
            const alto = (Math.abs(mes.utilidad) / escala) * (AREA_ALTO / 2);
            const esPositivo = mes.utilidad >= 0;
            const y = esPositivo ? centroY - alto : centroY;
            const esUltimo = i === meses.length - 1;
            return (
              <g key={mes.clave}>
                <rect
                  className="reportes-barra"
                  x={centroX - barraAncho / 2}
                  y={y}
                  width={barraAncho}
                  height={Math.max(alto, 0)}
                  rx={4}
                  fill={esPositivo ? "url(#gradGanancia)" : "url(#gradPerdida)"}
                >
                  <title>{`${mes.etiqueta} — Utilidad: ${formatoLempiras(mes.utilidad)}`}</title>
                </rect>
                {esUltimo && (
                  <text
                    x={centroX}
                    y={esPositivo ? y - 4 : y + alto + 12}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={600}
                    fill="#171717"
                  >
                    {formatoLempiras(mes.utilidad)}
                  </text>
                )}
                <text
                  x={centroX}
                  y={ALTO_GRAFICO - MARGEN.abajo + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#737373"
                >
                  {mes.etiqueta}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-neutral-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR_GANANCIA }} />
          Ganancia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR_PERDIDA }} />
          Pérdida
        </span>
      </div>
    </div>
  );
}

function GraficoCategorias({
  datos,
  color,
  idSufijo,
}: {
  datos: CategoriaMonto[];
  color: string;
  idSufijo: string;
}) {
  const ALTO_FILA = 28;
  const ALTO_TOTAL = datos.length * ALTO_FILA + 12;
  const ANCHO_TOTAL = 560;
  const ANCHO_ETIQUETA = 130;
  const MARGEN_DER = 70;
  const anchoBarraMax = ANCHO_TOTAL - ANCHO_ETIQUETA - MARGEN_DER;
  const maxValor = Math.max(1, ...datos.map((d) => d.monto));
  const idGradiente = `gradCategoria-${idSufijo}`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${ANCHO_TOTAL} ${ALTO_TOTAL}`} className="w-full min-w-[420px]" role="img">
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.75} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
        </defs>
        {datos.map((d, i) => {
          const y = i * ALTO_FILA + 6;
          const anchoBarra = (d.monto / maxValor) * anchoBarraMax;
          return (
            <g key={d.clave}>
              <text x={ANCHO_ETIQUETA - 8} y={y + 14} textAnchor="end" fontSize={11} fill="#404040">
                {d.etiqueta}
              </text>
              <rect
                className="reportes-barra"
                x={ANCHO_ETIQUETA}
                y={y + 4}
                width={Math.max(anchoBarra, 2)}
                height={16}
                rx={4}
                fill={`url(#${idGradiente})`}
              >
                <title>{`${d.etiqueta}: ${formatoLempiras(d.monto)}`}</title>
              </rect>
              <text x={ANCHO_ETIQUETA + anchoBarra + 6} y={y + 16} fontSize={10} fontWeight={600} fill="#171717">
                {formatoLempiras(d.monto)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Reporte mensual: un solo "resumen del mes" que junta números que ya
 * existen en otros módulos (Ingreso/Gasto.monto -- 100% automáticos, ver
 * finanzas/page.tsx --, RegistroProduccion/RegistroMezcla.totalGanado|
 * monto, PagoEmpleado.totalGanado, Compra.montoTotal, Pedido.montoTotal)
 * en vez de un generador de reportes a la medida con filtros libres. El
 * bloque de arriba (tarjetas de Finanzas con delta vs. mes anterior +
 * mini-tendencia) y los 4 gráficos de abajo cubren el pedido explícito del
 * usuario de que la página se sienta "más dinámica a la vista"; el resto
 * de las tarjetas (Producción, Pagos, Inventario) se dejaron como texto
 * simple con un acento de color -- no tienen 6 meses de historial ya
 * calculado a mano como Finanzas, y agregarles su propia serie de tiempo
 * habría sido mucho más alcance del que se pidió (mismo criterio de
 * simplificación deliberada que el Calendario sin arrastrar y soltar,
 * Fase 7).
 */
export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const mesValido = mes && /^\d{4}-\d{2}$/.test(mes);
  const mesActual = mesValido ? mes! : claveDiaHonduras(new Date()).slice(0, 7);
  const { inicio, fin } = rangoMesHonduras(mesActual);
  const mesAnterior = mesAdyacente(mesActual, -1);
  const mesSiguiente = mesAdyacente(mesActual, 1);
  const mesDeHoy = claveDiaHonduras(new Date()).slice(0, 7);

  // Últimos 6 meses (incluye el actual) para las tendencias de Finanzas.
  const meses6: string[] = [];
  {
    let cursor = mesActual;
    for (let i = 0; i < 6; i++) {
      meses6.unshift(cursor);
      cursor = mesAdyacente(cursor, -1);
    }
  }
  const inicioTendencia = rangoMesHonduras(meses6[0]).inicio;

  const [
    ingresosTendencia,
    gastosTendencia,
    pedidosNuevos,
    pedidosEntregados,
    registrosProduccion,
    registrosMezcla,
    pagosSemana,
    compras,
    materiales,
  ] = await Promise.all([
    prisma.ingreso.findMany({
      where: { fecha: { gte: inicioTendencia, lt: fin } },
      select: { monto: true, fecha: true, categoria: true },
    }),
    prisma.gasto.findMany({
      where: { fecha: { gte: inicioTendencia, lt: fin } },
      select: { monto: true, fecha: true, categoria: true },
    }),
    prisma.pedido.aggregate({
      where: { creadoEn: { gte: inicio, lt: fin } },
      _sum: { montoTotal: true },
      _count: true,
    }),
    prisma.pedido.aggregate({
      where: { fechaEntregaReal: { gte: inicio, lt: fin } },
      _sum: { montoTotal: true },
      _count: true,
    }),
    prisma.registroProduccion.aggregate({
      where: { fecha: { gte: inicio, lt: fin } },
      _sum: { cantidadProducida: true, totalGanado: true },
      _count: true,
    }),
    prisma.registroMezcla.aggregate({
      where: { fecha: { gte: inicio, lt: fin } },
      _sum: { monto: true },
      _count: true,
    }),
    prisma.pagoEmpleado.findMany({
      where: { semanaInicio: { gte: inicio, lt: fin } },
      select: { estado: true, totalGanado: true },
    }),
    prisma.compra.aggregate({
      where: { fecha: { gte: inicio, lt: fin } },
      _sum: { montoTotal: true },
      _count: true,
    }),
    prisma.materialInventario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, cantidadActual: true, cantidadMinima: true, unidadMedida: true },
    }),
  ]);

  const ingresosMesActual = ingresosTendencia.filter((i) => claveMesDe(i.fecha) === mesActual);
  const gastosMesActual = gastosTendencia.filter((g) => claveMesDe(g.fecha) === mesActual);

  const tendenciaFinanzas: MesTendencia[] = meses6.map((clave) => {
    const ingresosDelMes = ingresosTendencia
      .filter((i) => claveMesDe(i.fecha) === clave)
      .reduce((s, i) => s + Number(i.monto), 0);
    const gastosDelMes = gastosTendencia
      .filter((g) => claveMesDe(g.fecha) === clave)
      .reduce((s, g) => s + Number(g.monto), 0);
    return {
      clave,
      etiqueta: nombreMesCorto(clave),
      ingresos: ingresosDelMes,
      gastos: gastosDelMes,
      utilidad: ingresosDelMes - gastosDelMes,
    };
  });

  const mesActualDatos = tendenciaFinanzas[tendenciaFinanzas.length - 1];
  const mesAnteriorDatos = tendenciaFinanzas[tendenciaFinanzas.length - 2];
  const totalIngresos = mesActualDatos.ingresos;
  const totalGastos = mesActualDatos.gastos;
  const utilidad = mesActualDatos.utilidad;
  const deltaIngresos = calcularDelta(totalIngresos, mesAnteriorDatos.ingresos);
  const deltaGastos = calcularDelta(totalGastos, mesAnteriorDatos.gastos);
  const deltaUtilidad = calcularDelta(utilidad, mesAnteriorDatos.utilidad);

  const ingresosPorCategoria: CategoriaMonto[] = (() => {
    const mapa = new Map<TipoIngreso, number>();
    for (const i of ingresosMesActual) {
      const categoria = i.categoria as TipoIngreso;
      mapa.set(categoria, (mapa.get(categoria) ?? 0) + Number(i.monto));
    }
    return Array.from(mapa.entries())
      .map(([categoria, monto]) => ({ clave: categoria, etiqueta: ETIQUETA_TIPO_INGRESO[categoria], monto }))
      .sort((a, b) => b.monto - a.monto);
  })();

  const gastosPorCategoria: CategoriaMonto[] = (() => {
    const mapa = new Map<TipoGasto, number>();
    for (const g of gastosMesActual) {
      const categoria = g.categoria as TipoGasto;
      mapa.set(categoria, (mapa.get(categoria) ?? 0) + Number(g.monto));
    }
    return Array.from(mapa.entries())
      .map(([categoria, monto]) => ({ clave: categoria, etiqueta: ETIQUETA_TIPO_GASTO[categoria], monto }))
      .sort((a, b) => b.monto - a.monto);
  })();

  const pagadoEmpleados = pagosSemana
    .filter((p) => p.estado === "PAGADO")
    .reduce((suma, p) => suma + Number(p.totalGanado), 0);
  const pendienteEmpleados = pagosSemana
    .filter((p) => p.estado === "PENDIENTE")
    .reduce((suma, p) => suma + Number(p.totalGanado), 0);

  const materialesBajos = materiales.filter(
    (m) => Number(m.cantidadMinima) > 0 && Number(m.cantidadActual) <= Number(m.cantidadMinima)
  );

  return (
    <div>
      <EstiloReportes />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Reportes</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/reportes?mes=${mesAnterior}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            ← Anterior
          </Link>
          <Link
            href={`/admin/reportes?mes=${mesDeHoy}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Hoy
          </Link>
          <Link
            href={`/admin/reportes?mes=${mesSiguiente}`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Siguiente →
          </Link>
        </div>
      </div>
      <p className="mt-1 text-lg font-medium text-neutral-800">
        Resumen de {nombreMes(mesActual)}
      </p>
      <p className="mt-1 max-w-2xl text-sm text-neutral-500">
        Junta los números que ya se registran en Finanzas, Producción, Pagos semanales e
        Inventario. Para el detalle línea por línea, entra al módulo correspondiente.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TarjetaStat
          titulo="Ingresos"
          valor={formatoLempiras(totalIngresos)}
          subtitulo={`${ingresosMesActual.length} movimiento(s)`}
          delta={deltaIngresos}
          colorDelta={(positivo) => (positivo ? "bueno" : "malo")}
          color={COLOR_INGRESOS}
          tendencia={tendenciaFinanzas.map((m) => m.ingresos)}
          retraso={0}
        />
        <TarjetaStat
          titulo="Gastos"
          valor={formatoLempiras(totalGastos)}
          subtitulo={`${gastosMesActual.length} movimiento(s)`}
          delta={deltaGastos}
          colorDelta={(positivo) => (positivo ? "malo" : "bueno")}
          color={COLOR_GASTOS}
          tendencia={tendenciaFinanzas.map((m) => m.gastos)}
          retraso={60}
        />
        <TarjetaStat
          titulo="Utilidad"
          valor={formatoLempiras(utilidad)}
          delta={deltaUtilidad}
          colorDelta={(positivo) => (positivo ? "bueno" : "malo")}
          color={utilidad >= 0 ? COLOR_GANANCIA : COLOR_PERDIDA}
          tendencia={tendenciaFinanzas.map((m) => m.utilidad)}
          retraso={120}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className="reportes-aparece rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          style={{ animationDelay: "160ms" }}
        >
          <h2 className="text-sm font-semibold text-neutral-900">Ingresos y gastos — últimos 6 meses</h2>
          <div className="mt-3">
            <GraficoTendenciaFinanzas meses={tendenciaFinanzas} />
          </div>
        </div>
        <div
          className="reportes-aparece rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          style={{ animationDelay: "200ms" }}
        >
          <h2 className="text-sm font-semibold text-neutral-900">Utilidad — últimos 6 meses</h2>
          <div className="mt-3">
            <GraficoUtilidad meses={tendenciaFinanzas} />
          </div>
        </div>
        <div
          className="reportes-aparece rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          style={{ animationDelay: "240ms" }}
        >
          <h2 className="text-sm font-semibold text-neutral-900">
            Ingresos por categoría — {nombreMes(mesActual)}
          </h2>
          <div className="mt-3">
            {ingresosPorCategoria.length > 0 ? (
              <GraficoCategorias datos={ingresosPorCategoria} color={COLOR_INGRESOS} idSufijo="ingresos" />
            ) : (
              <p className="text-sm text-neutral-500">Sin ingresos registrados este mes.</p>
            )}
          </div>
        </div>
        <div
          className="reportes-aparece rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          style={{ animationDelay: "280ms" }}
        >
          <h2 className="text-sm font-semibold text-neutral-900">
            Gastos por categoría — {nombreMes(mesActual)}
          </h2>
          <div className="mt-3">
            {gastosPorCategoria.length > 0 ? (
              <GraficoCategorias datos={gastosPorCategoria} color={COLOR_GASTOS} idSufijo="gastos" />
            ) : (
              <p className="text-sm text-neutral-500">Sin gastos registrados este mes.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tarjeta
          titulo="Ventas (pedidos)"
          color={COLOR_VENTAS}
          retraso={320}
          filas={[
            {
              etiqueta: "Pedidos nuevos",
              valor: `${pedidosNuevos._count} — L. ${Number(pedidosNuevos._sum.montoTotal ?? 0).toFixed(2)}`,
            },
            {
              etiqueta: "Pedidos entregados",
              valor: `${pedidosEntregados._count} — L. ${Number(pedidosEntregados._sum.montoTotal ?? 0).toFixed(2)}`,
            },
          ]}
        />
        <Tarjeta
          titulo="Producción"
          color={COLOR_PRODUCCION}
          retraso={360}
          filas={[
            {
              etiqueta: "Piezas producidas",
              valor: `${registrosProduccion._sum.cantidadProducida ?? 0}`,
            },
            {
              etiqueta: "Pagado en producción",
              valor: `L. ${Number(registrosProduccion._sum.totalGanado ?? 0).toFixed(2)}`,
            },
            {
              etiqueta: "Pagado en mezcla",
              valor: `L. ${Number(registrosMezcla._sum.monto ?? 0).toFixed(2)} (${registrosMezcla._count})`,
            },
          ]}
        />
        <Tarjeta
          titulo="Pagos a empleados"
          color={COLOR_PAGOS}
          retraso={400}
          filas={[
            { etiqueta: "Pagado", valor: `L. ${pagadoEmpleados.toFixed(2)}` },
            { etiqueta: "Pendiente", valor: `L. ${pendienteEmpleados.toFixed(2)}` },
          ]}
        />
        <Tarjeta
          titulo="Inventario"
          color={COLOR_INVENTARIO}
          retraso={440}
          filas={[
            {
              etiqueta: "Gastado en compras",
              valor: `L. ${Number(compras._sum.montoTotal ?? 0).toFixed(2)} (${compras._count})`,
            },
            { etiqueta: "Materiales con stock bajo", valor: `${materialesBajos.length}` },
          ]}
        />
      </div>

      {materialesBajos.length > 0 && (
        <div className="reportes-aparece mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-800">Stock bajo ahora mismo</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {materialesBajos.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/inventario/${m.id}`} className="hover:underline">
                  {m.nombre}
                </Link>{" "}
                — {m.cantidadActual.toString()} {m.unidadMedida} (mínimo {m.cantidadMinima.toString()})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
