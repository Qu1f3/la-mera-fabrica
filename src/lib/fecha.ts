// Helpers de fecha en hora de Honduras (UTC-6, sin horario de verano).
//
// Vercel corre los servidores en UTC -- cualquier cálculo de "días
// transcurridos" o de fecha visible al cliente debe pasar por acá en vez de
// usar new Date() y el reloj del servidor directamente, para no desfasarse
// según a qué hora del día caiga la medianoche real de Honduras.

const ZONA_HONDURAS = "America/Tegucigalpa";

export function formatearFechaHonduras(
  fecha: Date,
  opciones: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }
): string {
  return fecha.toLocaleDateString("es-HN", {
    ...opciones,
    timeZone: ZONA_HONDURAS,
  });
}

export function formatearFechaHoraHonduras(fecha: Date): string {
  return fecha.toLocaleString("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA_HONDURAS,
  });
}

/** "YYYY-MM-DD" del día calendario en Honduras -- para comparar días sin que
 * importe la hora exacta ni la zona horaria del servidor. */
export function claveDiaHonduras(fecha: Date): string {
  return fecha.toLocaleDateString("en-CA", { timeZone: ZONA_HONDURAS });
}

/**
 * Rango [inicio, fin) en UTC de un día calendario de Honduras -- para
 * filtros de Prisma tipo "entregas de hoy" que sean correctos sin importar
 * a qué hora UTC corre el servidor (Honduras es UTC-6 fijo, sin horario de
 * verano: la medianoche de Honduras cae a las 06:00 UTC del mismo día).
 */
export function rangoDiaHonduras(fecha: Date = new Date()): { inicio: Date; fin: Date } {
  const dia = claveDiaHonduras(fecha);
  const inicio = new Date(`${dia}T06:00:00.000Z`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return { inicio, fin };
}

/**
 * Días de calendario transcurridos entre dos fechas, contados en hora de
 * Honduras (no en bloques de 24 horas exactas). Ej: si un pedido entró a
 * secado el 25/08 a las 11pm y hoy es 26/08 a la 1am (hora de Honduras), ya
 * es "1 día de secado", aunque hayan pasado menos de 24 horas reales.
 */
export function diasTranscurridosHonduras(
  desde: Date,
  hasta: Date = new Date()
): number {
  const msPorDia = 24 * 60 * 60 * 1000;
  const diaDesde = new Date(`${claveDiaHonduras(desde)}T00:00:00Z`).getTime();
  const diaHasta = new Date(`${claveDiaHonduras(hasta)}T00:00:00Z`).getTime();
  return Math.round((diaHasta - diaDesde) / msPorDia);
}

/**
 * Rango [inicio, fin) en UTC de un mes calendario de Honduras, a partir de
 * "YYYY-MM" -- para el calendario admin (Fase 7): filtra pedidos/entregas
 * que caen en ese mes sin que importe a qué hora UTC corre el servidor.
 */
export function rangoMesHonduras(mesTexto: string): { inicio: Date; fin: Date } {
  const [anioStr, mesStr] = mesTexto.split("-");
  const anio = Number(anioStr);
  const mes = Number(mesStr); // 1-12
  // Honduras es UTC-6 fijo: la medianoche local cae a las 06:00 UTC.
  const inicio = new Date(Date.UTC(anio, mes - 1, 1, 6, 0, 0));
  const fin = new Date(Date.UTC(mes === 12 ? anio + 1 : anio, mes === 12 ? 0 : mes, 1, 6, 0, 0));
  return { inicio, fin };
}

/**
 * Celdas de una grilla de calendario mensual (domingo a sábado), a partir
 * de "YYYY-MM". Las celdas vacías antes del día 1 o después del último día
 * del mes vienen con diaMes=null para rellenar la grilla en semanas
 * completas. clave es "YYYY-MM-DD" (para cruzar contra los mapas de
 * pedidos/entregas agrupados por día) o "" si la celda está vacía.
 */
export function grillaMesHonduras(
  mesTexto: string
): { clave: string; diaMes: number | null }[] {
  const [anioStr, mesStr] = mesTexto.split("-");
  const anio = Number(anioStr);
  const mes = Number(mesStr);

  const primerDiaMes = new Date(Date.UTC(anio, mes - 1, 1));
  const diaSemanaPrimero = primerDiaMes.getUTCDay(); // 0 = domingo
  const diasEnMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const mesStrPad = mesStr.padStart(2, "0");

  const celdas: { clave: string; diaMes: number | null }[] = [];
  for (let i = 0; i < diaSemanaPrimero; i++) {
    celdas.push({ clave: "", diaMes: null });
  }
  for (let d = 1; d <= diasEnMes; d++) {
    celdas.push({ clave: `${anioStr}-${mesStrPad}-${String(d).padStart(2, "0")}`, diaMes: d });
  }
  while (celdas.length % 7 !== 0) {
    celdas.push({ clave: "", diaMes: null });
  }
  return celdas;
}

/**
 * Convierte el valor de un <input type="date"> ("YYYY-MM-DD") al instante
 * UTC que representa la medianoche de ESE día en Honduras (06:00 UTC).
 *
 * OJO: esto corre en server actions, es decir en el servidor (Vercel corre
 * en UTC, no en hora de Honduras). `new Date(`${texto}T00:00:00`)` construye
 * medianoche en la zona horaria de quien ejecuta el código -- en el
 * navegador sería hora de Honduras (correcto), pero en el servidor es UTC
 * (incorrecto: queda 6 horas adelantado, y al mostrarse de vuelta en hora
 * de Honduras cae en el día anterior). Por eso hay que armar la fecha a
 * mano con el offset fijo de Honduras en vez de dejar que `Date` asuma la
 * zona horaria de donde corre el proceso.
 */
export function fechaDesdeInputHonduras(
  valor: FormDataEntryValue | null | undefined
): Date | null {
  const texto = String(valor ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const fecha = new Date(`${texto}T06:00:00.000Z`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** "YYYY-MM" del mes anterior/siguiente a partir de "YYYY-MM". */
export function mesAdyacente(mesTexto: string, delta: 1 | -1): string {
  const [anioStr, mesStr] = mesTexto.split("-");
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  const fecha = new Date(Date.UTC(anio, mes - 1 + delta, 1));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
}
