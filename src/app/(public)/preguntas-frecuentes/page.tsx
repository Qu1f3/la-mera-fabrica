import type { Metadata } from "next";
import { listFaqsActivas } from "@/lib/data/contenido";
import { construirFaqJsonLd, jsonLdSeguro } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Preguntas frecuentes — La Mera Fábrica",
  description:
    "Respuestas a las preguntas más comunes sobre nuestros mosaicos y molduras para piso.",
};

// Ver la nota en src/app/(public)/nosotros/page.tsx: contenido que cambia
// poco, cacheado hasta 5 minutos para ahorrar consultas a la base de datos.
export const revalidate = 300;

export default async function PreguntasFrecuentesPage() {
  const faqs = await listFaqsActivas();
  const faqJsonLd = construirFaqJsonLd(faqs);

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      {/* Solo se agrega FAQPage si hay al menos una pregunta real cargada —
          nunca se inventa contenido para tener datos estructurados. */}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdSeguro(faqJsonLd) }}
        />
      )}
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        Preguntas frecuentes
      </h1>

      {faqs.length > 0 ? (
        <dl className="mt-8 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b border-neutral-200 pb-6">
              <dt className="text-sm font-semibold text-carbon">
                {faq.pregunta}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-neutral-700">
                {faq.respuesta}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-6 text-sm text-piedra">
          Todavía no hay preguntas frecuentes publicadas. Si tienes alguna
          duda, escríbenos por WhatsApp.
        </p>
      )}
    </main>
  );
}
