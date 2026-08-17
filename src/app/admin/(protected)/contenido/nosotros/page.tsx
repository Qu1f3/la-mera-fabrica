import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  actualizarNosotros,
  borrarImagenNosotros,
  subirImagenNosotros,
} from "./actions";

export const metadata = { title: "Nosotros — Panel administrativo" };

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";
const labelClass = "text-sm font-medium text-neutral-700";

export default async function NosotrosPage() {
  const seccion = await prisma.seccionContenido.findUnique({
    where: { clave: "nosotros" },
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Nosotros</h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Este texto aparece en la página pública &quot;/nosotros&quot;. Mientras esté
        vacío, esa página muestra un aviso honesto de que la sección todavía
        se está preparando — no un texto genérico ni inventado.
      </p>

      <form
        action={actualizarNosotros}
        className="mt-6 space-y-5 rounded-lg border border-neutral-200 bg-white p-6"
      >
        <div className="space-y-1">
          <label htmlFor="titulo" className={labelClass}>
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            defaultValue={seccion?.titulo ?? "Nosotros"}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="cuerpo" className={labelClass}>
            Texto
          </label>
          <textarea
            id="cuerpo"
            name="cuerpo"
            rows={8}
            defaultValue={seccion?.cuerpo ?? ""}
            placeholder="La historia real del negocio: cómo empezó, quiénes lo forman, qué los distingue..."
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Guardar
        </button>
      </form>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">Imagen</h2>

        {seccion?.imagenUrl ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-24 w-40 overflow-hidden rounded-md bg-neutral-100">
              <Image
                src={seccion.imagenUrl}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <form action={borrarImagenNosotros}>
              <ConfirmSubmitButton
                confirmMessage="¿Quitar esta imagen?"
                className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Quitar imagen
              </ConfirmSubmitButton>
            </form>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Todavía no tiene imagen.
          </p>
        )}

        <form
          action={subirImagenNosotros}
          className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-neutral-300 p-4"
        >
          <input
            type="file"
            name="imagen"
            accept="image/png,image/jpeg,image/webp"
            className="text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            {seccion?.imagenUrl ? "Reemplazar imagen" : "Subir imagen"}
          </button>
        </form>
      </section>
    </div>
  );
}
