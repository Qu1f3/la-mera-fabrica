import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  actualizarBanner,
  borrarImagenBanner,
  eliminarBanner,
  subirImagenBanner,
} from "../actions";

export const metadata = { title: "Editar banner — Panel administrativo" };

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";
const labelClass = "text-sm font-medium text-neutral-700";

function comoFechaInput(fecha: Date | null): string {
  return fecha ? fecha.toISOString().slice(0, 10) : "";
}

export default async function EditarBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });

  if (!banner) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Editar banner
      </h1>
      <p className="mt-1 text-sm text-neutral-600">{banner.titulo}</p>

      <form
        action={actualizarBanner.bind(null, banner.id)}
        className="mt-6 space-y-5 rounded-lg border border-neutral-200 bg-white p-6"
      >
        <div className="space-y-1">
          <label htmlFor="titulo" className={labelClass}>
            Título *
          </label>
          <input
            id="titulo"
            name="titulo"
            defaultValue={banner.titulo}
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="subtitulo" className={labelClass}>
            Subtítulo (opcional)
          </label>
          <input
            id="subtitulo"
            name="subtitulo"
            defaultValue={banner.subtitulo ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="enlace" className={labelClass}>
            Enlace (opcional)
          </label>
          <input
            id="enlace"
            name="enlace"
            defaultValue={banner.enlace ?? ""}
            placeholder="/productos?tipo=MOSAICO"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="fechaInicio" className={labelClass}>
              Desde (opcional)
            </label>
            <input
              id="fechaInicio"
              name="fechaInicio"
              type="date"
              defaultValue={comoFechaInput(banner.fechaInicio)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="fechaFin" className={labelClass}>
              Hasta (opcional)
            </label>
            <input
              id="fechaFin"
              name="fechaFin"
              type="date"
              defaultValue={comoFechaInput(banner.fechaFin)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="orden" className={labelClass}>
            Orden
          </label>
          <input
            id="orden"
            name="orden"
            type="number"
            defaultValue={banner.orden}
            className={`${inputClass} w-24`}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={banner.activo}
            className="h-4 w-4"
          />
          Activo
        </label>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Guardar cambios
        </button>
      </form>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">Imagen</h2>

        {banner.imagenUrl ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-24 w-40 overflow-hidden rounded-md bg-neutral-100">
              <Image
                src={banner.imagenUrl}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <form action={borrarImagenBanner.bind(null, banner.id)}>
              <ConfirmSubmitButton
                confirmMessage="¿Quitar la imagen de este banner?"
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
          action={subirImagenBanner.bind(null, banner.id)}
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
            {banner.imagenUrl ? "Reemplazar imagen" : "Subir imagen"}
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Borrar este banner no se puede deshacer.
        </p>
        <form action={eliminarBanner.bind(null, banner.id)} className="mt-3">
          <ConfirmSubmitButton
            confirmMessage={`¿Borrar el banner "${banner.titulo}" para siempre?`}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Borrar banner
          </ConfirmSubmitButton>
        </form>
      </section>
    </div>
  );
}
