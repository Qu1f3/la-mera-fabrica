"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { subirImagenesProducto } from "@/app/admin/(protected)/productos/actions";
import { comprimirImagen } from "@/lib/img/comprimirImagen";

/**
 * Reemplaza el `<form action={subirImagenesProducto}>` plano por una
 * versión de cliente que comprime las fotos antes de enviarlas — ver
 * comentario en src/lib/img/comprimirImagen.ts para el motivo (límite de
 * 4.5MB de Vercel para el cuerpo de un Server Action).
 */
export function SubirFotosProducto({ productoId }: { productoId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const archivos = inputRef.current?.files;
    if (!archivos || archivos.length === 0) return;

    setProcesando(true);
    try {
      const comprimidas = await Promise.all(
        Array.from(archivos).map((archivo) => comprimirImagen(archivo))
      );
      const formData = new FormData();
      comprimidas.forEach((archivo) => formData.append("imagenes", archivo));

      startTransition(async () => {
        try {
          await subirImagenesProducto(productoId, formData);
          if (inputRef.current) inputRef.current.value = "";
        } catch {
          setError(
            "No se pudo subir alguna de las fotos. Intenta de nuevo — si el problema sigue, prueba con una foto más liviana o de menor resolución."
          );
        }
      });
    } catch {
      setError("No se pudieron preparar las fotos para subir. Intenta de nuevo.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-neutral-300 p-4"
    >
      <input
        ref={inputRef}
        type="file"
        name="imagenes"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="text-sm"
      />
      <button
        type="submit"
        disabled={procesando || pending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {procesando ? "Preparando fotos…" : pending ? "Subiendo…" : "Subir fotos"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
