import { prisma } from "@/lib/prisma";
import { FilaFaq } from "./FilaFaq";
import { NuevaFaqForm } from "./NuevaFaqForm";

export const metadata = { title: "Preguntas frecuentes — Panel administrativo" };

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
          <FilaFaq key={faq.id} faq={faq} />
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
        <NuevaFaqForm siguienteOrden={faqs.length} />
      </div>
    </div>
  );
}
