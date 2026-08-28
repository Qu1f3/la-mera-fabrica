import { crearBanner } from "../actions";

export const metadata = { title: "Nuevo banner — Panel administrativo" };

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";
const labelClass = "text-sm font-medium text-neutral-700";

export default function NuevoBannerPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Nuevo banner</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Después de crearlo puedes subirle una imagen.
      </p>

      <form
        action={crearBanner}
        className="mt-6 space-y-5 rounded-lg border border-neutral-200 bg-white p-6"
      >
        <div className="space-y-1">
          <label htmlFor="titulo" className={labelClass}>
            Título *
          </label>
          <input id="titulo" name="titulo" required className={inputClass} />
        </div>

        <div className="space-y-1">
          <label htmlFor="subtitulo" className={labelClass}>
            Subtítulo (opcional)
          </label>
          <input id="subtitulo" name="subtitulo" className={inputClass} />
        </div>

        <div className="space-y-1">
          <label htmlFor="enlace" className={labelClass}>
            Enlace (opcional)
          </label>
          <input
            id="enlace"
            name="enlace"
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
            defaultValue={0}
            className={`${inputClass} w-24`}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="activo" defaultChecked className="h-4 w-4" />
          Activo
        </label>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Crear banner
        </button>
      </form>
    </div>
  );
}
