"use client";

import { guardarEnCola, listarCola, quitarDeCola } from "./db";
import type {
  ItemCola,
  ItemColaExtra,
  ItemColaMovimiento,
  ItemColaProduccion,
  ItemColaPedido,
  ItemColaPedidoEstado,
  ItemColaPedidoFecha,
  ItemColaRiego,
  ItemColaEntrega,
  ConflictoPedido,
} from "./tipos";

const EMISOR = new EventTarget();
const EVENTO_CAMBIO = "cambio";

let sincronizando = false;

/**
 * ID único generado en el dispositivo -- se usa tanto para identificar el
 * item en la cola local como (en produccion/extras/pedidos) para el id
 * real del registro en la base, de modo que reintentar la sincronización
 * sea seguro (ver upsert-por-id / check-existence-first en
 * src/lib/produccion/registrar.ts, src/lib/extras/registrar.ts y
 * src/lib/pedidos/*.ts). No necesita el formato exacto de cuid() de
 * Prisma -- cualquier string único sirve, la columna es un String normal.
 */
export function generarIdLocal(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Reserva por si algún navegador viejo no tiene crypto.randomUUID -- no
  // necesita ser criptográficamente fuerte, solo no chocar.
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function avisarCambio() {
  EMISOR.dispatchEvent(new Event(EVENTO_CAMBIO));
}

export function suscribirseACambiosDeCola(callback: () => void): () => void {
  EMISOR.addEventListener(EVENTO_CAMBIO, callback);
  return () => EMISOR.removeEventListener(EVENTO_CAMBIO, callback);
}

export function estaSincronizando(): boolean {
  return sincronizando;
}

async function encolar(item: ItemCola) {
  await guardarEnCola(item);
  avisarCambio();
  // Intenta de una vez -- si hay señal, en la práctica el usuario casi
  // nunca ve el estado "pendiente"; si no hay, se queda solo en la cola.
  void procesarCola();
}

export async function encolarProduccion(payload: ItemColaProduccion["payload"]): Promise<void> {
  await encolar({
    id: generarIdLocal(),
    tipo: "produccion",
    creadoEn: new Date().toISOString(),
    intentos: 0,
    payload,
  });
}

export async function encolarExtra(payload: ItemColaExtra["payload"]): Promise<void> {
  await encolar({
    id: generarIdLocal(),
    tipo: "extra",
    creadoEn: new Date().toISOString(),
    intentos: 0,
    payload,
  });
}

export async function encolarMovimiento(payload: ItemColaMovimiento["payload"]): Promise<void> {
  await encolar({
    id: generarIdLocal(),
    tipo: "movimiento",
    creadoEn: new Date().toISOString(),
    intentos: 0,
    payload,
  });
}

/**
 * A diferencia de los demás encolar* (que son "dispara y olvida"), este
 * ESPERA a que termine el primer intento de sincronización antes de
 * devolver el control -- así el formulario (NuevoPedidoForm.tsx) puede
 * saber si el pedido ya quedó guardado en el servidor (para llevar a la
 * persona directo al detalle, con el código a la vista para copiarlo o
 * mandarlo por WhatsApp) o si se quedó pendiente (sin conexión, o el
 * servidor lo rechazó), en cuyo caso no tiene sentido navegar a una
 * página de detalle que todavía no existe del otro lado.
 */
export async function encolarPedido(
  payload: ItemColaPedido["payload"]
): Promise<{ pedidoId: string; sincronizado: boolean }> {
  const id = generarIdLocal();
  await guardarEnCola({
    id,
    tipo: "pedido",
    creadoEn: new Date().toISOString(),
    intentos: 0,
    payload,
  });
  avisarCambio();
  await procesarCola();
  const sigueEnCola = (await listarCola<ItemCola>()).some((item) => item.id === id);
  return { pedidoId: payload.idPedido, sincronizado: !sigueEnCola };
}

export async function encolarCambioEstado(payload: ItemColaPedidoEstado["payload"]): Promise<void> {
  await encolar({
    id: generarIdLocal(),
    tipo: "pedidoEstado",
    creadoEn: new Date().toISOString(),
    intentos: 0,
    payload,
  });
}

export async function encolarFechaPrometida(payload: ItemColaPedidoFecha["payload"]): Promise<void> {
  await encolar({
    id: generarIdLocal(),
    tipo: "pedidoFecha",
    creadoEn: new Date().toISOString(),
    intentos: 0,
    payload,
  });
}

export async function encolarRiego(payload: ItemColaRiego["payload"]): Promise<void> {
  await encolar({
    id: generarIdLocal(),
    tipo: "riego",
    creadoEn: new Date().toISOString(),
    intentos: 0,
    payload,
  });
}

export async function encolarEntrega(payload: ItemColaEntrega["payload"]): Promise<void> {
  await encolar({
    id: generarIdLocal(),
    tipo: "entrega",
    creadoEn: new Date().toISOString(),
    intentos: 0,
    payload,
  });
}

export async function obtenerCola(): Promise<ItemCola[]> {
  const items = await listarCola<ItemCola>();
  return items.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
}

const RUTA_POR_TIPO: Record<ItemCola["tipo"], string> = {
  produccion: "/api/offline/produccion",
  extra: "/api/offline/extras",
  movimiento: "/api/offline/inventario",
  pedido: "/api/offline/pedidos",
  pedidoEstado: "/api/offline/pedidos/estado",
  pedidoFecha: "/api/offline/pedidos/fecha",
  riego: "/api/offline/pedidos/riego",
  entrega: "/api/offline/pedidos/entrega",
};

type ResultadoEnvio = { ok: boolean; error?: string; conflicto?: ConflictoPedido };

async function enviarItem(item: ItemCola): Promise<ResultadoEnvio> {
  const ruta = RUTA_POR_TIPO[item.tipo];
  const cuerpo = {
    ...item.payload,
    fecha: item.creadoEn,
    sincronizadoOffline: true,
  };

  try {
    const respuesta = await fetch(ruta, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    if (respuesta.status === 409) {
      const datos = await respuesta
        .json()
        .catch(() => ({}) as { servidorActual?: ConflictoPedido });
      return { ok: false, conflicto: datos.servidorActual };
    }
    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}) as { error?: string });
      return { ok: false, error: datos.error || `Error del servidor (${respuesta.status}).` };
    }
    return { ok: true };
  } catch {
    // Sin conexión (o se cayó a mitad de camino) -- no es un error real
    // del registro, se vuelve a intentar más adelante.
    return { ok: false };
  }
}

/**
 * Recorre la cola EN ORDEN (una a la vez, no en paralelo -- importa para
 * que dos registros del mismo empleado/producto/pedido queden en el mismo
 * orden en que se hicieron) y sincroniza contra el servidor lo que se
 * pueda. Se llama sola al reconectar, al abrir la app, al volver a primer
 * plano, y cada cierto tiempo mientras haya pendientes -- ver
 * useEstadoOffline.ts.
 */
export async function procesarCola(): Promise<void> {
  if (sincronizando) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  sincronizando = true;
  avisarCambio();
  try {
    const items = await obtenerCola();
    for (const item of items) {
      // Un cambio de estado/fecha que ya chocó una vez se queda quieto
      // hasta que la persona decida qué hacer (ver ConflictosPendientes.tsx
      // y resolverConflicto más abajo) -- reintentarlo solo, sin que nadie
      // haya mirado el conflicto, iría exactamente en contra de "que me
      // avise y yo decida manualmente".
      if ((item.tipo === "pedidoEstado" || item.tipo === "pedidoFecha") && item.conflicto) {
        continue;
      }

      const resultado = await enviarItem(item);
      if (resultado.ok) {
        await quitarDeCola(item.id);
        avisarCambio();
        continue;
      }
      if (resultado.conflicto && (item.tipo === "pedidoEstado" || item.tipo === "pedidoFecha")) {
        item.conflicto = resultado.conflicto;
        item.ultimoError = "Alguien más cambió este pedido mientras no había conexión -- revisa y decide qué hacer.";
        await guardarEnCola(item);
        avisarCambio();
        continue;
      }
      if (resultado.error) {
        // Error real del servidor (no de red) -- se deja en la cola con el
        // motivo, para que quien revise el panel sepa que algo necesita
        // atención en vez de reintentar en silencio para siempre.
        item.intentos += 1;
        item.ultimoError = resultado.error;
        await guardarEnCola(item);
        avisarCambio();
        continue;
      }
      // Sin red de verdad -- no tiene sentido seguir con el resto ahora.
      break;
    }
  } finally {
    sincronizando = false;
    avisarCambio();
  }
}

/**
 * Resuelve manualmente un conflicto de pedido (ver ConflictosPendientes.tsx):
 * "descartar" tira a la basura el cambio que se hizo sin conexión (gana lo
 * que ya quedó guardado en el servidor); "forzar" reenvía el mismo cambio
 * pero pidiéndole al servidor que lo aplique de todas formas, sin volver a
 * comparar la versión.
 */
export async function resolverConflicto(
  itemId: string,
  resolucion: "descartar" | "forzar"
): Promise<void> {
  if (resolucion === "descartar") {
    await quitarDeCola(itemId);
    avisarCambio();
    return;
  }

  const items = await listarCola<ItemCola>();
  const item = items.find((i) => i.id === itemId);
  if (!item) return;

  // Rama por rama (en vez de comparar item.tipo una sola vez con "||") para
  // que TypeScript conserve la relación entre item.tipo y la forma exacta
  // de item.payload en cada asignación -- una unión de los dos tipos de
  // payload en una sola rama no siempre se deja asignar de vuelta.
  if (item.tipo === "pedidoEstado") {
    item.payload = { ...item.payload, forzar: true };
  } else if (item.tipo === "pedidoFecha") {
    item.payload = { ...item.payload, forzar: true };
  } else {
    return;
  }
  item.conflicto = undefined;
  item.ultimoError = undefined;
  await guardarEnCola(item);
  avisarCambio();
  void procesarCola();
}
