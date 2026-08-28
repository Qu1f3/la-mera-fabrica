import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { actualizarFaq, crearFaq, eliminarFaq } from "./actions";

export const metadata = { title: "Preguntas frecuentes — Panel administrativo" };

const inputClass =
  "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export default async function FaqAdminPage() {
  const faqs = await prisma.faq.findMany({ orderBy: { orden: "asc" } });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Preguntas frecuentes
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Se muestran en &quot;/preguntas-frecuentes&quot; en el orden que definas aquí.
        Solo se ven las que estén activas.
      </p>

      <div className="mt-6 space-y-4">
        {faqs.map((faq) => (
          <form
            key={faq.id}
            action={actualizarFaq.bind(null, faq.id)}
            className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-500">
                Pregunta
              </label>
              <input
                name="pregunta"
                defaultValue={faq.pregunta}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-500">
                Respuesta
              </label>
              <textarea
                name="respuesta"
                defaultValue={faq.respuesta}
                required
                rows={2}
                className={inputClass}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                  Orden
                  <input
                    type="number"
                    name="orden"
                    defaultValue={faq.orden}
                    className={`${inputClass} w-16`}
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    name="activo"
                    defaultChecked={faq.activo}
                    className="h-4 w-4"
                  />
                  Activa
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Guardar
                </button>
                <ConfirmSubmitButton
                  formAction={eliminarFaq.bind(null, faq.id)}
                  confirmMessage="¿Borrar esta pregunta frecuente?"
                  className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Borrar
                </ConfirmSubmitButton>
              </div>
            </div>
          </form>
        ))}

        {faqs.length === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
            Todavía no hay preguntas frecuentes.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Nueva pregunta
        </h2>
        <form action={crearFaq} className="mt-3 space-y-3">
          <input
            name="pregunta"
            placeholder="Pregunta"
            required
            className={inputClass}
          />
          <textarea
            name="respuesta"
            placeholder="Respuesta"
            required
            rows={2}
            className={inputClass}
          />
          <div className="flex items-center gap-3">
            <input
              type="number"
              name="orden"
              placeholder="Orden"
              defaultValue={faqs.length}
              className={`${inputClass} w-24`}
            />
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Agregar pregunta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
