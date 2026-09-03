"use client";

import { useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/admin/ui/Toast";
import { SelectorEstado } from "@/components/admin/ui/SelectorEstado";
import { ETIQUETA_ESTADO_PEDIDO, COLOR_ESTADO_PEDIDO } from "@/lib/types";
import type { EstadoPedido } from "@/lib/types";
import { encolarCambioEstado, generarIdLocal } from "@/lib/offline/sync";

/**
 * Antes era una Server Action con useActionState. Desde la Fase 4 de "modo
 * sin conexión" (ver propuesta-modo-offline.md) pasa por
 * encolarCambioEstado(), que manda también `actualizadoEn` tal como esta
 * página lo vio al cargar -- si para cuando se sincroniza el pedido ya
 * cambió del otro lado (otro dispositivo lo editó mientras este estaba sin
 * conexión), el cambio NO se aplica a ciegas: se guarda como conflicto
 * pendiente y aparece en ConflictosPendientes.tsx para que la persona
 * decida manualmente qué hacer.
 */
export function CambiarEstadoPedidoForm({
  pedidoId,
  estadoActual,
  estados,
  actualizadoEn,
}: {
  pedidoId: string;
  estadoActual: string;
  estados: EstadoPedido[];
  actualizadoEn: string;
}) {
  const { mostrarToast } = useToast();
  const notasRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const formData = new FormData(evento.currentTarget);
    const estado = String(formData.get("estado") || "");
    const notas = String(formData.get("notas") || "").trim() || null;
    if (!estado) {
      setError("Selecciona un estado.");
      return;
    }

    setPending(true);
    try {
      await encolarCambioEstado({
        pedidoId,
        estado,
        notas,
        idHistorial: generarIdLocal(),
        versionEsperada: actualizadoEn,
      });
      mostrarToast("Cambio de estado guardado.");
      if (notasRef.current) notasRef.current.value = "";
    } catch {
      setError("No se pudo guardar en este dispositivo. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="mt-2 flex flex-wrap items-end gap-2">
      <SelectorEstado
        nombre="estado"
        valorInicial={estadoActual}
        opciones={estados.map((estado) => ({
          valor: estado,
          etiqueta: ETIQUETA_ESTADO_PEDIDO[estado],
          colorClasses: COLOR_ESTADO_PEDIDO[estado],
        }))}
      />
      <input
        ref={notasRef}
        name="notas"
        placeholder="Nota opcional del cambio"
        className="min-w-[200px] flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
