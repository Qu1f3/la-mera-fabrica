"use client";

import { useEstadoOffline } from "@/lib/offline/useEstadoOffline";
import { resolverConflicto } from "@/lib/offline/sync";
import { ETIQUETA_ESTADO_PEDIDO, type EstadoPedido } from "@/lib/types";
import { formatearFechaHonduras } from "@/lib/fecha";

function etiquetaEstado(estado: string): string {
  return ETIQUETA_ESTADO_PEDIDO[estado as EstadoPedido] ?? estado;
}

function etiquetaFecha(iso: string | null): string {
  return iso ? formatearFechaHonduras(new Date(iso)) : "Sin asignar";
}

function etiquetaFechaInput(valor: string): string {
  if (!valor) return "Sin asignar";
  // valor ya viene en yyyy-mm-dd -- se arma la fecha a mediodía para que el
  // formateo no la corra un día por la zona horaria del navegador.
  return formatearFechaHonduras(new Date(`${valor}T12:00:00`));
}

/**
 * Banner de conflictos manuales pendientes de resolver -- ver "que me avise
 * y yo decida manualmente" en propuesta-modo-offline.md, Fase 4. Aparece
 * SOLO cuando dos dispositivos sin conexión editaron el mismo pedido
 * (estado o fecha prometida) y las dos versiones no coinciden; el resto de
 * la cola sin conexión (Producción, Extras, Inventario, crear un pedido,
 * riego, entregas) nunca puede chocar así, porque esos registros solo se
 * crean, nunca se editan (ver EstadoConexion.tsx para el resto de la cola).
 */
export function ConflictosPendientes() {
  const { conflictos } = useEstadoOffline();

  if (conflictos.length === 0) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-3">
      <p className="text-sm font-semibold text-amber-900">
        {conflictos.length === 1
          ? "Un cambio no se pudo aplicar: alguien más editó ese mismo pedido mientras este dispositivo no tenía conexión."
          : `${conflictos.length} cambios no se pudieron aplicar: alguien más editó esos mismos pedidos mientras este dispositivo no tenía conexión.`}
      </p>
      <ul className="mt-2 space-y-2">
        {conflictos.map((item) => {
          const servidor = item.conflicto;
          if (!servidor) return null;
          return (
            <li key={item.id} className="rounded-md border border-amber-300 bg-white p-3 text-sm">
              <p className="font-medium text-neutral-900">Pedido #{servidor.codigo}</p>
              {item.tipo === "pedidoEstado" ? (
                <p className="mt-1 text-neutral-700">
                  Intentaste cambiar el estado a{" "}
                  <span className="font-medium">{etiquetaEstado(item.payload.estado)}</span>, pero
                  en el servidor ya quedó en{" "}
                  <span className="font-medium">{etiquetaEstado(servidor.estado)}</span>.
                </p>
              ) : (
                <p className="mt-1 text-neutral-700">
                  Intentaste cambiar la fecha prometida a{" "}
                  <span className="font-medium">{etiquetaFechaInput(item.payload.fechaPrometidaInput)}</span>,
                  pero en el servidor ya quedó en{" "}
                  <span className="font-medium">{etiquetaFecha(servidor.fechaPrometida)}</span>.
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void resolverConflicto(item.id, "forzar")}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
                >
                  Aplicar mi cambio de todas formas
                </button>
                <button
                  type="button"
                  onClick={() => void resolverConflicto(item.id, "descartar")}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Descartar mi cambio (dejar lo del servidor)
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
