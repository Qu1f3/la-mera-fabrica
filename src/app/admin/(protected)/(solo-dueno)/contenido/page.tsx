import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Contenido — Panel administrativo" };

export default async function ContenidoPage() {
  const [banners, faqs, testimonios, nosotros] = await Promise.all([
    prisma.banner.count(),
    prisma.faq.count(),
    prisma.testimonio.count(),
    prisma.seccionContenido.findUnique({ where: { clave: "nosotros" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Contenido</h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Banners, la sección &quot;Nosotros&quot;, preguntas frecuentes y testimonios del
        sitio público.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/contenido/banners"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{banners}</p>
          <p className="text-sm text-neutral-600">
            {banners === 1 ? "banner" : "banners"} — ver todos
          </p>
        </Link>
        <Link
          href="/admin/contenido/nosotros"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-sm font-medium text-neutral-900">
            {nosotros?.cuerpo ? "Sección con contenido" : "Falta llenar el texto"}
          </p>
          <p className="text-sm text-neutral-600">editar Nosotros</p>
        </Link>
        <Link
          href="/admin/contenido/faq"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{faqs}</p>
          <p className="text-sm text-neutral-600">
            {faqs === 1 ? "pregunta frecuente" : "preguntas frecuentes"} — ver
            todas
          </p>
        </Link>
        <Link
          href="/admin/contenido/testimonios"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">
            {testimonios}
          </p>
          <p className="text-sm text-neutral-600">
            {testimonios === 1 ? "testimonio" : "testimonios"} — ver todos
          </p>
        </Link>
      </div>
    </div>
  );
}
