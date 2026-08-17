import type { Metadata } from "next";
import Image from "next/image";
import { getSeccionNosotros } from "@/lib/data/contenido";

export const metadata: Metadata = {
  title: "Nosotros — La Mera Fábrica",
  description:
    "Conoce La Mera Fábrica, mosaicos y molduras para piso en Nacaome, Valle, Honduras.",
};

// Contenido que casi nunca cambia — se sirve cacheado hasta 5 minutos en
// vez de consultar la base de datos en cada visita (ver Fase 0: minimizar
// costos operativos). Si lo editas en el panel, `revalidatePath` en las
// Server Actions de /admin/contenido refresca la página al instante, sin
// esperar esos 5 minutos.
export const revalidate = 300;

export default async function NosotrosPage() {
  const seccion = await getSeccionNosotros();

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        {seccion?.titulo ?? "Nosotros"}
      </h1>

      {seccion?.imagenUrl && (
        <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-lg bg-neutral-100">
          <Image
            src={seccion.imagenUrl}
            alt={seccion.titulo}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {seccion?.cuerpo ? (
        <div className="mt-6 space-y-4 text-sm leading-relaxed whitespace-pre-line text-neutral-700">
          {seccion.cuerpo}
        </div>
      ) : (
        <p className="mt-6 text-sm text-piedra">
          Todavía estamos preparando esta sección. Mientras tanto, escríbenos
          por WhatsApp si quieres saber más sobre nosotros.
        </p>
      )}
    </main>
  );
}
