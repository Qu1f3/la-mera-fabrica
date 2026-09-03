"use client";

import { useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/admin/ui/Toast";
import { encolarEntrega, generarIdLocal } from "@/lib/offline/sync";

export function CrearEntregaForm({ pedidoId }: { pedidoId: string }) {
  const { mostrarToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    const formData = new FormData(evento.currentTarget);
    const fechaProgramadaInput = String(formData.get("fechaProgramada") || "");
    const notas = String(formData.get("notas") || "").trim() || null;

    setPending(true);
    try {
      await encolarEntrega({
        pedidoId,
        fechaProgramadaInput,
        notas,
        idEntrega: generarIdLocal(),
      });
      mostrarToast("Entrega programada.");
      formRef.current?.reset();
    } catch {
      setError("No se pudo guardar en este dispositivo. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={alEnviar} className="flex flex-wrap items-end gap-2">
      <label className="text-sm text-neutral-700">
        Fecha programada (opcional)
        <input
          type="date"
          name="fechaProgramada"
          className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
        />
      </label>
      <input
        name="notas"
        placeholder="Notas (opcional)"
        className="min-w-[180px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Programar entrega"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
