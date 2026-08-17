import { prisma } from "@/lib/prisma";
import { actualizarConfiguracion } from "./actions";

export const metadata = { title: "Configuración — Panel administrativo" };

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";
const labelClass = "text-sm font-medium text-neutral-700";

export default async function ConfiguracionPage() {
  const config = await prisma.configuracion.findUnique({
    where: { id: "global" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Configuración
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Estos datos alimentan el botón de WhatsApp, el pie de página y el
        contacto en todo el sitio público. Mientras un campo quede vacío, lo
        que dependa de él simplemente no se muestra (por ejemplo, el botón de
        WhatsApp no aparece hasta que pongas el número).
      </p>

      <form
        action={actualizarConfiguracion}
        className="mt-6 max-w-xl space-y-5 rounded-lg border border-neutral-200 bg-white p-6"
      >
        <div className="space-y-1">
          <label htmlFor="whatsappNumero" className={labelClass}>
            Número de WhatsApp
          </label>
          <input
            id="whatsappNumero"
            name="whatsappNumero"
            defaultValue={config?.whatsappNumero ?? ""}
            placeholder="Ej: 50499999999 (con código de país, solo números)"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="horarioAtencion" className={labelClass}>
            Horario de atención
          </label>
          <input
            id="horarioAtencion"
            name="horarioAtencion"
            defaultValue={config?.horarioAtencion ?? ""}
            placeholder="Ej: Lunes a sábado, 8am a 5pm"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="direccion" className={labelClass}>
            Dirección
          </label>
          <input
            id="direccion"
            name="direccion"
            defaultValue={config?.direccion ?? ""}
            placeholder="Dirección del local o taller (si es visitable)"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="mapaUrl" className={labelClass}>
            Enlace de Google Maps
          </label>
          <input
            id="mapaUrl"
            name="mapaUrl"
            defaultValue={config?.mapaUrl ?? ""}
            placeholder="Pega aquí el enlace para compartir de Google Maps"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="facebookUrl" className={labelClass}>
            Facebook
          </label>
          <input
            id="facebookUrl"
            name="facebookUrl"
            defaultValue={config?.facebookUrl ?? ""}
            placeholder="https://facebook.com/..."
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="instagramUrl" className={labelClass}>
            Instagram
          </label>
          <input
            id="instagramUrl"
            name="instagramUrl"
            defaultValue={config?.instagramUrl ?? ""}
            placeholder="https://instagram.com/..."
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Guardar configuración
        </button>
      </form>
    </div>
  );
}
