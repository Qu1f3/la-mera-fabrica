/**
 * Versión "para el navegador" de src/lib/pedidoCodigo.ts -- misma forma de
 * código (8 caracteres del mismo alfabeto sin 0/O/1/I/L), pero SIN
 * verificar contra la base de datos, porque esta función se usa para
 * generar el código de un pedido que se está guardando sin conexión (no
 * hay forma de consultar la base en ese momento).
 *
 * Con 8 caracteres de un alfabeto de 31 símbolos la probabilidad de
 * choque es extremadamente baja (~1 en 850 mil millones); por si acaso,
 * registrarPedidoCompartido (src/lib/pedidos/crear.ts) igual reintenta
 * con un código verificado contra la base si este llegara a chocar.
 *
 * A propósito NO tiene "server-only" -- se importa desde un componente de
 * cliente (NuevoPedidoForm.tsx).
 */
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LARGO_CODIGO = 8;

export function generarCodigoPedidoCliente(): string {
  let codigo = "";
  for (let i = 0; i < LARGO_CODIGO; i++) {
    codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return codigo;
}
