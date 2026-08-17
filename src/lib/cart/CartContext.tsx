"use client";

/**
 * Carrito de cotización: vive solo en el navegador (localStorage), no en la
 * base de datos, hasta que el cliente envía el formulario en /cotizacion (ver
 * Fase 0, decisión 2 — "la cotización es el checkout real del sitio"). Nada
 * de cuentas ni login: es un carrito anónimo, como cualquier tienda simple.
 *
 * Se implementa como un external store con `useSyncExternalStore` en vez del
 * patrón más común "leer localStorage en un useEffect y guardarlo con
 * useState" — ese patrón dispara la regla de ESLint
 * `react-hooks/set-state-in-effect` (llamar a setState de forma síncrona
 * dentro de un efecto), porque en general sincronizar estado así causa
 * renders en cascada evitables. `useSyncExternalStore` es la forma que React
 * mismo recomienda para este caso exacto: una fuente de verdad externa
 * (localStorage) que puede diferir entre el render del servidor y el del
 * navegador. No hace falta un <CartProvider>: el estado vive a nivel de
 * módulo, compartido por cualquier componente que llame a `useCart()`.
 */

import { useCallback, useSyncExternalStore } from "react";
import type { ItemCarrito } from "@/lib/types";

const CLAVE_STORAGE = "lamerafabrica:cotizacion";

let cache: ItemCarrito[] | null = null;
const listeners = new Set<() => void>();

function leerStorage(): ItemCarrito[] {
  try {
    const guardado = window.localStorage.getItem(CLAVE_STORAGE);
    if (!guardado) return [];
    const parseado = JSON.parse(guardado);
    return Array.isArray(parseado) ? parseado : [];
  } catch {
    // localStorage no disponible (modo privado, etc.) o dato corrupto — se
    // arranca con el carrito vacío en vez de romper la página.
    return [];
  }
}

function escribirStorage(items: ItemCarrito[]) {
  try {
    window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(items));
  } catch {
    // idem — si no se puede guardar, el carrito solo dura la sesión.
  }
}

function getSnapshot(): ItemCarrito[] {
  if (cache === null) cache = leerStorage();
  return cache;
}

// En el servidor no existe localStorage: el snapshot del servidor siempre es
// un carrito vacío, y useSyncExternalStore se encarga de reconciliar con el
// valor real del navegador después de hidratar, sin warnings de hidratación.
//
// Importante: la misma referencia de array en cada llamada, no un `[]`
// nuevo — useSyncExternalStore compara snapshots por igualdad de referencia
// (Object.is) para decidir si algo cambió, y devolver un array nuevo cada
// vez lo hace pensar que el snapshot cambia en cada render, lo que dispara
// "The result of getServerSnapshot should be cached to avoid an infinite
// loop".
const SNAPSHOT_SERVIDOR: ItemCarrito[] = [];
function getServerSnapshot(): ItemCarrito[] {
  return SNAPSHOT_SERVIDOR;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function actualizar(actualizador: (previo: ItemCarrito[]) => ItemCarrito[]) {
  const nuevo = actualizador(cache ?? leerStorage());
  cache = nuevo;
  escribirStorage(nuevo);
  listeners.forEach((listener) => listener());
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // `cantidad` es opcional: un cliente puede querer cotización de un
  // producto sin saber todavía cuántos m²/ml necesita (`null` = "por
  // confirmar", no cero). Si el producto ya estaba en el carrito y se
  // vuelve a agregar, se suman las cantidades solo si ambas son conocidas —
  // si cualquiera de las dos es "por confirmar", el resultado queda "por
  // confirmar" en vez de inventar un número.
  const agregarItem = useCallback(
    (item: Omit<ItemCarrito, "cantidad">, cantidad: number | null) => {
      actualizar((previo) => {
        const existente = previo.find((i) => i.productoId === item.productoId);
        if (existente) {
          const combinada =
            existente.cantidad != null && cantidad != null
              ? existente.cantidad + cantidad
              : null;
          return previo.map((i) =>
            i.productoId === item.productoId
              ? { ...i, cantidad: combinada }
              : i
          );
        }
        return [...previo, { ...item, cantidad }];
      });
    },
    []
  );

  const actualizarCantidad = useCallback(
    (productoId: string, cantidad: number | null) => {
      actualizar((previo) =>
        previo.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i))
      );
    },
    []
  );

  const quitarItem = useCallback((productoId: string) => {
    actualizar((previo) => previo.filter((i) => i.productoId !== productoId));
  }, []);

  const vaciar = useCallback(() => actualizar(() => []), []);

  return { items, agregarItem, actualizarCantidad, quitarItem, vaciar };
}
