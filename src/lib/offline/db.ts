"use client";

/**
 * Envoltorio mínimo de IndexedDB para la cola de sincronización sin
 * conexión (ver propuesta-modo-offline.md) -- a propósito SIN ninguna
 * librería externa: evita que esto dependa de correr `npm install` antes
 * de poder probarlo, y lo que hace falta acá es muy poco (un solo
 * almacén, leer/escribir/borrar por clave).
 *
 * No se usa para "ver" datos sin conexión -- eso lo resuelve el service
 * worker cacheando la página ya renderizada (ver public/sw.js). Esto es
 * solo la cola de escrituras pendientes.
 */

const NOMBRE_DB = "lmf-offline";
const VERSION_DB = 1;
const ALMACEN_COLA = "cola";

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB no disponible en este navegador."));
      return;
    }
    const solicitud = indexedDB.open(NOMBRE_DB, VERSION_DB);
    solicitud.onupgradeneeded = () => {
      const db = solicitud.result;
      if (!db.objectStoreNames.contains(ALMACEN_COLA)) {
        db.createObjectStore(ALMACEN_COLA, { keyPath: "id" });
      }
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

export async function guardarEnCola<T extends { id: string }>(item: T): Promise<void> {
  const db = await abrirDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ALMACEN_COLA, "readwrite");
      tx.objectStore(ALMACEN_COLA).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function listarCola<T>(): Promise<T[]> {
  const db = await abrirDb();
  try {
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(ALMACEN_COLA, "readonly");
      const solicitud = tx.objectStore(ALMACEN_COLA).getAll();
      solicitud.onsuccess = () => resolve(solicitud.result as T[]);
      solicitud.onerror = () => reject(solicitud.error);
    });
  } finally {
    db.close();
  }
}

export async function quitarDeCola(id: string): Promise<void> {
  const db = await abrirDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ALMACEN_COLA, "readwrite");
      tx.objectStore(ALMACEN_COLA).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
