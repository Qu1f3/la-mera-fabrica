/**
 * Dato real del negocio (no inventado, confirmado por el usuario): sus
 * mosaicos rinden 16 piezas por m². Es el mismo tamaño de pieza en todo el
 * catálogo, así que este número es válido para cualquier producto de tipo
 * MOSAICO — si en el futuro el negocio vende un mosaico de otro tamaño,
 * este valor dejaría de ser universal y habría que sacarlo de las
 * especificaciones de cada producto en vez de un solo número fijo aquí.
 *
 * Centralizado en un solo lugar para que la calculadora de cobertura, el
 * carrito y el mensaje de WhatsApp usen siempre el mismo número.
 */
export const MOSAICOS_POR_M2 = 16;

/** Cuántas piezas de mosaico corresponden a una cantidad en m². */
export function piezasDeMosaico(metrosCuadrados: number): number {
  return Math.ceil(metrosCuadrados * MOSAICOS_POR_M2);
}
