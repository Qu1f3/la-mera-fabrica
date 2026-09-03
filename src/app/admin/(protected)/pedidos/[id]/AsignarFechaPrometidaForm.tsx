"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/admin/ui/Toast";
import { encolarFechaPrometida } from "@/lib/offline/sync";

/**
 * Ver mismo comentario grande en CambiarEstadoPedidoForm.tsx sobre por qué
 * ahora pasa por la cola sin conexión y manda `actualizadoEn` para poder
 * detectar un conflicto -- misma idea acá con encolarFechaPrometida().
 * generarIdLocal() ya no hace falta para esta acción en particular (no
 * tiene ningún efecto secundario que duplicar en un reintento, ver
 * src/lib/pedidos/fecha.ts), solo se usa el id que genera encolar() para
 * la cola misma.
 */
export function AsignarFechaPrometidaForm({
  pedidoId,
  fechaInicial,
  actualizadoEn,
}: {
  pedidoId: string;
  fechaInicial: string;
  actualizadoEn: string;
}) {
  const { mostrarToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const formData = new FormData(evento.currentTarget);
    const fechaPrometidaInput = String(formData.get("fechaPrometida") || "");

    setPending(true);
    try {
      await encolarFechaPrometida({
        pedidoId,
        fechaPrometidaInput,
        versionEsperada: actualizadoEn,
      });
      mostrarToast("Fecha prometida guardada.");
    } catch {
      setError("No se pudo guardar en este dispositivo. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="mt-1 flex flex-wrap items-end gap-2">
      <label className="text-sm text-neutral-700">
        Fecha prometida
        <input
          type="date"
          name="fechaPrometida"
          defaultValue={fechaInicial}
          className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
