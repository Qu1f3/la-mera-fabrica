import { prisma } from "@/lib/prisma";
import { FilaTestimonio } from "./FilaTestimonio";
import { NuevoTestimonioForm } from "./NuevoTestimonioForm";

export const metadata = { title: "Testimonios — Panel administrativo" };

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
          <FilaTestimonio key={testimonio.id} testimonio={testimonio} />
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
        <NuevoTestimonioForm />
      </div>
    </div>
  );
}
