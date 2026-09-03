"use client";

import { useCallback, useEffect, useState } from "react";
import { estaSincronizando, obtenerCola, procesarCola, suscribirseACambiosDeCola } from "./sync";
import type { ItemCola } from "./tipos";

/**
 * Estado de conexión + cola de sincronización para mostrar en la UI (ver
 * EstadoConexion.tsx). También es quien dispara los reintentos: al
 * reconectar, al volver la pestaña/app a primer plano, y cada 20s
 * mientras haya pendientes -- el evento "online" del navegador no siempre
 * es confiable del todo (sobre todo en una PWA instalada en iPhone), así
 * que el intervalo es la red de seguridad real.
 */
export function useEstadoOffline() {
  const [online, setOnline] = useState(true);
  const [cola, setCola] = useState<ItemCola[]>([]);
  const [sincronizando, setSincronizando] = useState(false);

  const refrescar = useCallback(() => {
    obtenerCola()
      .then(setCola)
      .catch(() => {});
    setSincronizando(estaSincronizando());
  }, []);

  useEffect(() => {
    // navigator solo existe en el cliente -- por eso este valor no se puede
    // calcular como estado inicial de useState (rompería el render en el
    // servidor) y hay que corregirlo acá, la primera vez que el efecto
    // corre después de montar. Ver
    // https://react.dev/learn/you-might-not-need-an-effect -- este es
    // justamente el caso de "sincronizar con un sistema externo" (el
    // estado real de conexión del navegador) que la guía sí recomienda
    // resolver con un efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ver comentario arriba
    setOnline(navigator.onLine);
    refrescar();

    const alConectar = () => {
      setOnline(true);
      void procesarCola();
    };
    const alDesconectar = () => setOnline(false);
    const alVolverVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void procesarCola();
      }
    };

    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    document.addEventListener("visibilitychange", alVolverVisible);
    const cancelarSuscripcion = suscribirseACambiosDeCola(refrescar);
    const intervalo = window.setInterval(() => {
      if (navigator.onLine) void procesarCola();
    }, 20000);

    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
      document.removeEventListener("visibilitychange", alVolverVisible);
      window.clearInterval(intervalo);
      cancelarSuscripcion();
    };
  }, [refrescar]);

  const pendientes = cola.length;
  // Un item "en conflicto" (ver ConflictosPendientes.tsx) también tiene
  // ultimoError, así que se cuentan aparte -- uno necesita que alguien
  // decida manualmente, el otro se puede seguir reintentando solo.
  const conflictos = cola.filter(
    (item) => (item.tipo === "pedidoEstado" || item.tipo === "pedidoFecha") && item.conflicto
  ) as Array<Extract<ItemCola, { tipo: "pedidoEstado" | "pedidoFecha" }>>;
  const conError = cola.filter((item) => item.ultimoError && conflictos.every((c) => c.id !== item.id)).length;

  return { online, pendientes, conError, sincronizando, conflictos };
}
