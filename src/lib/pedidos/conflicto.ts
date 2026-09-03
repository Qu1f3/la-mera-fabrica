import "server-only";
import type { Pedido } from "@prisma/client";

/**
 * Resumen del pedido tal como está AHORA en el servidor, para mostrarle al
 * usuario cuando su cambio (hecho sin conexión) choca contra un cambio más
 * reciente de otro dispositivo -- ver estado.ts y fecha.ts. Se manda tal
 * cual al navegador en la respuesta 409 de las rutas de API
 * correspondientes (src/app/api/offline/pedidos/estado y .../fecha).
 */
export type ConflictoPedidoServidor = {
  codigo: string;
  estado: string;
  fechaPrometida: string | null;
  actualizadoEn: string;
};

export function resumenParaConflicto(pedido: Pedido): ConflictoPedidoServidor {
  return {
    codigo: pedido.codigo,
    estado: pedido.estado,
    fechaPrometida: pedido.fechaPrometida ? pedido.fechaPrometida.toISOString() : null,
    actualizadoEn: pedido.actualizadoEn.toISOString(),
  };
}
