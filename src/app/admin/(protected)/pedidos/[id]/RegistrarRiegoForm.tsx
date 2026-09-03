"use client";

import { useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/admin/ui/Toast";
import { encolarRiego, generarIdLocal } from "@/lib/offline/sync";

export function RegistrarRiegoForm({ pedidoId }: { pedidoId: string }) {
  const { mostrarToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    const formData = new FormData(evento.currentTarget);
    const observacion = String(formData.get("observacion") || "").trim() || null;

    setPending(true);
    try {
      await encolarRiego({ pedidoId, observacion, idRiego: generarIdLocal() });
      mostrarToast("Riego registrado.");
      formRef.current?.reset();
    } catch {
      setError("No se pudo guardar en este dispositivo. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={alEnviar} className="flex flex-wrap items-end gap-2">
      <label className="flex-1 text-sm text-neutral-700">
        Observación (opcional)
        <input
          name="observacion"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Registrar riego de hoy"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
