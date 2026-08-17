import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [productos, categorias, cotizacionesNuevas, config, piezasContenido] =
    await Promise.all([
      prisma.producto.count(),
      prisma.categoria.count(),
      prisma.solicitudCotizacion.count({ where: { estado: "NUEVA" } }),
      prisma.configuracion.findUnique({ where: { id: "global" } }),
      Promise.all([
        prisma.banner.count(),
        prisma.faq.count(),
        prisma.testimonio.count(),
      ]).then(([banners, faqs, testimonios]) => banners + faqs + testimonios),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Bienvenido</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        SEO, analítica y calculadora de cobertura (Fases 5 y 6) todavía no
        están construidas.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link
          href="/admin/productos"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{productos}</p>
          <p className="text-sm text-neutral-600">productos — ver todos</p>
        </Link>
        <Link
          href="/admin/categorias"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{categorias}</p>
          <p className="text-sm text-neutral-600">categorías — ver todas</p>
        </Link>
        <Link
          href="/admin/cotizaciones"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">
            {cotizacionesNuevas}
          </p>
          <p className="text-sm text-neutral-600">
            {cotizacionesNuevas === 1
              ? "cotización nueva sin contactar"
              : "cotizaciones nuevas sin contactar"}
          </p>
        </Link>
        <Link
          href="/admin/contenido"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">
            {piezasContenido}
          </p>
          <p className="text-sm text-neutral-600">
            piezas de contenido — banners, FAQ, testimonios
          </p>
        </Link>
        <Link
          href="/admin/configuracion"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-sm font-medium text-neutral-900">
            {config?.whatsappNumero ? "WhatsApp configurado" : "Falta configurar WhatsApp"}
          </p>
          <p className="text-sm text-neutral-600">ir a configuración</p>
        </Link>
      </div>
    </div>
  );
}
