import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { SubirImagenUnica } from "@/components/admin/SubirImagenUnica";
import { NosotrosForm } from "./NosotrosForm";
import { BorrarImagenNosotrosForm } from "./BorrarImagenNosotrosForm";
import { subirImagenNosotros } from "./actions";

export const metadata = { title: "Nosotros — Panel administrativo" };

export default async function NosotrosPage() {
  const seccion = await prisma.seccionContenido.findUnique({
    where: { clave: "nosotros" },
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Nosotros</h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Este texto aparece en la página pública &quot;/nosotros&quot;. Mientras esté
        vacío, esa página muestra un aviso honesto de que la sección todavía
        se está preparando — no un texto genérico ni inventado.
      </p>

      <NosotrosForm
        titulo={seccion?.titulo ?? "Nosotros"}
        cuerpo={seccion?.cuerpo ?? ""}
      />

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">Imagen</h2>

        {seccion?.imagenUrl ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-24 w-40 overflow-hidden rounded-md bg-neutral-100">
              <Image
                src={seccion.imagenUrl}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <BorrarImagenNosotrosForm />
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Todavía no tiene imagen.
          </p>
        )}

        <SubirImagenUnica
          accion={subirImagenNosotros}
          textoBoton={seccion?.imagenUrl ? "Reemplazar imagen" : "Subir imagen"}
        />
      </section>
    </div>
  );
}
