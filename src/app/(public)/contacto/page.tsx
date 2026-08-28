import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { WhatsAppButton } from "@/components/catalogo/WhatsAppButton";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta a La Mera Fábrica por WhatsApp para cotizaciones de mosaicos y molduras para piso en Nacaome, Valle, Honduras.",
};

// Ver la nota en src/app/(public)/nosotros/page.tsx: contenido que cambia
// poco, cacheado hasta 5 minutos para ahorrar consultas a la base de datos.
export const revalidate = 300;

export default async function ContactoPage() {
  const config = await prisma.configuracion.findUnique({
    where: { id: "global" },
  });

  const hayDatos =
    config?.whatsappNumero ||
    config?.horarioAtencion ||
    config?.direccion ||
    config?.facebookUrl ||
    config?.instagramUrl;

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        Contacto
      </h1>
      <p className="mt-2 text-sm text-piedra">
        Mosaicos y molduras para piso — Nacaome, Valle, Honduras.
      </p>

      {hayDatos ? (
        <dl className="mt-8 space-y-5 text-sm">
          {config?.horarioAtencion && (
            <div>
              <dt className="font-medium text-carbon">Horario de atención</dt>
              <dd className="mt-1 text-neutral-700">
                {config.horarioAtencion}
              </dd>
            </div>
          )}
          {config?.direccion && (
            <div>
              <dt className="font-medium text-carbon">Dirección</dt>
              <dd className="mt-1 text-neutral-700">{config.direccion}</dd>
              {config.mapaUrl && (
                <a
                  href={config.mapaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-terracota hover:underline"
                >
                  Ver en Google Maps →
                </a>
              )}
            </div>
          )}
          {(config?.facebookUrl || config?.instagramUrl) && (
            <div>
              <dt className="font-medium text-carbon">Redes sociales</dt>
              <dd className="mt-1 flex gap-4 text-neutral-700">
                {config?.facebookUrl && (
                  <a
                    href={config.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-terracota hover:underline"
                  >
                    Facebook
                  </a>
                )}
                {config?.instagramUrl && (
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-terracota hover:underline"
                  >
                    Instagram
                  </a>
                )}
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-6 text-sm text-piedra">
          Todavía no hemos publicado nuestros datos de contacto aquí.
        </p>
      )}

      <div className="mt-8">
        <WhatsAppButton
          numero={config?.whatsappNumero}
          mensaje="Hola, quisiera más información sobre sus productos."
        >
          Escríbenos por WhatsApp
        </WhatsAppButton>
      </div>
    </main>
  );
}
