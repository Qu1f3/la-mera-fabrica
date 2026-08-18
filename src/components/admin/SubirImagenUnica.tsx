"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { comprimirImagen } from "@/lib/img/comprimirImagen";

/**
 * Versión de un solo archivo del mismo patrón que
 * src/components/admin/SubirFotosProducto.tsx — usada para la imagen de un
 * banner o de la sección "Nosotros". Comprime la foto en el navegador antes
 * de enviarla (ver src/lib/img/comprimirImagen.ts).
 */
export function SubirImagenUnica({
  accion,
  nombreCampo = "imagen",
  textoBoton = "Subir imagen",
}: {
  accion: (formData: FormData) => Promise<void>;
  nombreCampo?: string;
  textoBoton?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const archivo = inputRef.current?.files?.[0];
    if (!archivo) return;

    setProcesando(true);
    try {
      const comprimida = await comprimirImagen(archivo);
      const formData = new FormData();
      formData.append(nombreCampo, comprimida);

      startTransition(async () => {
        try {
          await accion(formData);
          if (inputRef.current) inputRef.current.value = "";
        } catch {
          setError(
            "No se pudo subir la imagen. Intenta de nuevo — si el problema sigue, prueba con una foto más liviana o de menor resolución."
          );
        }
      });
    } catch {
      setError("No se pudo preparar la imagen para subir. Intenta de nuevo.");
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
        name={nombreCampo}
        accept="image/png,image/jpeg,image/webp"
        className="text-sm"
      />
      <button
        type="submit"
        disabled={procesando || pending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
      >
        {procesando ? "Preparando imagen…" : pending ? "Subiendo…" : textoBoton}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
