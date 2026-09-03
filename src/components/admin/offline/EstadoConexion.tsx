"use client";

import { useEstadoOffline } from "@/lib/offline/useEstadoOffline";

/**
 * Banner fijo en la parte de arriba de TODO /admin: mientras no haya nada
 * pendiente y haya señal, no se muestra nada. Ver propuesta-modo-offline.md
 * punto 4 -- "un indicador visible de sin conexión / cambios pendientes".
 */
export function EstadoConexion() {
  const { online, pendientes, conError, sincronizando } = useEstadoOffline();

  if (online && pendientes === 0) return null;

  const plural = (n: number, singular: string, pluralForma: string) =>
    n === 1 ? singular : pluralForma;

  let mensaje: string;
  let clase: string;

  if (!online) {
    clase = "bg-amber-100 text-amber-900 border-amber-300";
    mensaje =
      pendientes > 0
        ? `Sin conexión — ${pendientes} ${plural(pendientes, "cambio pendiente", "cambios pendientes")} de sincronizar`
        : "Sin conexión — lo que registres se guarda en este dispositivo y se sincroniza solo al volver la señal";
  } else if (conError > 0) {
    clase = "bg-red-100 text-red-900 border-red-300";
    mensaje = `${conError} ${plural(conError, "cambio no se pudo", "cambios no se pudieron")} sincronizar todavía — se seguirá reintentando`;
  } else if (sincronizando) {
    clase = "bg-blue-100 text-blue-900 border-blue-300";
    mensaje = "Sincronizando…";
  } else {
    clase = "bg-amber-100 text-amber-900 border-amber-300";
    mensaje = `${pendientes} ${plural(pendientes, "cambio pendiente", "cambios pendientes")} de sincronizar`;
  }

  return (
    <div role="status" className={`border-b px-4 py-2 text-center text-sm font-medium ${clase}`}>
      {mensaje}
    </div>
  );
}
