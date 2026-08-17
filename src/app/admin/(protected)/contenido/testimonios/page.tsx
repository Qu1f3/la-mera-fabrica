import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  actualizarTestimonio,
  crearTestimonio,
  eliminarTestimonio,
} from "./actions";

export const metadata = { title: "Testimonios — Panel administrativo" };

const inputClass =
  "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export default async function TestimoniosAdminPage() {
  const testimonios = await prisma.testimonio.findMany({
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Testimonios</h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Solo testimonios reales de clientes — la sección de testimonios en el
        sitio público simplemente no aparece si no hay ninguno activo. Nunca
        cargues uno inventado.
      </p>

      <div className="mt-6 space-y-4">
        {testimonios.map((testimonio) => (
          <form
            key={testimonio.id}
            action={actualizarTestimonio.bind(null, testimonio.id)}
            className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">
                  Nombre del cliente
                </label>
                <input
                  name="nombreCliente"
                  defaultValue={testimonio.nombreCliente}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">
                  Calificación (1 a 5, opcional)
                </label>
                <input
                  type="number"
                  name="calificacion"
                  min={1}
                  max={5}
                  defaultValue={testimonio.calificacion ?? ""}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-500">
                Testimonio
              </label>
              <textarea
                name="texto"
                defaultValue={testimonio.texto}
                required
                rows={2}
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-500">
                Foto del cliente (enlace, opcional)
              </label>
              <input
                name="fotoUrl"
                defaultValue={testimonio.fotoUrl ?? ""}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  name="activo"
                  defaultChecked={testimonio.activo}
                  className="h-4 w-4"
                />
                Activo
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Guardar
                </button>
                <ConfirmSubmitButton
                  formAction={eliminarTestimonio.bind(null, testimonio.id)}
                  confirmMessage="¿Borrar este testimonio?"
                  className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Borrar
                </ConfirmSubmitButton>
              </div>
            </div>
          </form>
        ))}

        {testimonios.length === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
            Todavía no hay testimonios.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Nuevo testimonio
        </h2>
        <form action={crearTestimonio} className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="nombreCliente"
              placeholder="Nombre del cliente"
              required
              className={inputClass}
            />
            <input
              type="number"
              name="calificacion"
              min={1}
              max={5}
              placeholder="Calificación 1-5 (opcional)"
              className={inputClass}
            />
          </div>
          <textarea
            name="texto"
            placeholder="Lo que dijo el cliente"
            required
            rows={2}
            className={inputClass}
          />
          <input
            name="fotoUrl"
            placeholder="Enlace a foto del cliente (opcional)"
            className={inputClass}
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Agregar testimonio
          </button>
        </form>
      </div>
    </div>
  );
}
