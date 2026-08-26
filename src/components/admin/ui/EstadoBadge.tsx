/**
 * Badge de estado reutilizable para todo el panel (pedidos, entregas, pagos,
 * etc.). Recibe ya armadas las clases de color (ver COLOR_ESTADO_PEDIDO /
 * COLOR_ESTADO_ENTREGA en src/lib/types.ts) para no acoplar este componente
 * a un enum en particular -- cualquier modulo nuevo puede definir su propio
 * mapa de colores y reusar este mismo Badge.
 */
export function EstadoBadge({
  label,
  colorClasses,
}: {
  label: string;
  colorClasses: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${colorClasses}`}
    >
      {label}
    </span>
  );
}
