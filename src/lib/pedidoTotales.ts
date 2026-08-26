// Cálculo centralizado de los montos de un pedido -- montoTotal,
// montoAnticipo, porcentajeAnticipo y saldoPendiente se guardan como
// columnas propias en Pedido (ver prisma/schema.prisma), así que cualquier
// lugar que cree o edite items / cambie el anticipo debe recalcularlos acá,
// no a mano, para que nunca queden desincronizados.

export type ItemParaTotal = { cantidad: number; precioUnitario: number };

/**
 * El anticipo normalmente es un porcentaje del total (60% por defecto),
 * pero a veces el cliente deja un monto cerrado que no corresponde a
 * ningún porcentaje redondo (ej: "hoy dejó L.3,000"). En ese caso se
 * guarda el monto tal cual y el porcentaje se calcula hacia atrás solo
 * para mostrarlo -- Pedido.porcentajeAnticipo nunca queda vacío.
 */
export type EntradaAnticipo =
  | { modo: "PORCENTAJE"; porcentaje: number }
  | { modo: "MONTO_FIJO"; monto: number };

/** Redondea a 2 decimales evitando errores típicos de punto flotante. */
function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function calcularSubtotal(cantidad: number, precioUnitario: number): number {
  return redondear2(cantidad * precioUnitario);
}

export function calcularTotalesPedido(
  items: ItemParaTotal[],
  anticipo: EntradaAnticipo
): {
  montoTotal: number;
  montoAnticipo: number;
  porcentajeAnticipo: number;
  saldoPendiente: number;
} {
  const montoTotal = redondear2(
    items.reduce(
      (suma, item) => suma + calcularSubtotal(item.cantidad, item.precioUnitario),
      0
    )
  );

  let montoAnticipo: number;
  let porcentajeAnticipo: number;
  if (anticipo.modo === "MONTO_FIJO") {
    montoAnticipo = redondear2(anticipo.monto);
    porcentajeAnticipo =
      montoTotal > 0 ? redondear2((montoAnticipo / montoTotal) * 100) : 0;
  } else {
    porcentajeAnticipo = anticipo.porcentaje;
    montoAnticipo = redondear2(montoTotal * (porcentajeAnticipo / 100));
  }

  const saldoPendiente = redondear2(montoTotal - montoAnticipo);
  return { montoTotal, montoAnticipo, porcentajeAnticipo, saldoPendiente };
}
