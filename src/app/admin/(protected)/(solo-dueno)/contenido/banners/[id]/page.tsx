import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubirImagenUnica } from "@/components/admin/SubirImagenUnica";
import { subirImagenBanner } from "../actions";
import { EditarBannerForm } from "./EditarBannerForm";
import { BorrarImagenBannerForm } from "./BorrarImagenBannerForm";
import { EliminarBannerForm } from "./EliminarBannerForm";

export const metadata = { title: "Editar banner — Panel administrativo" };

export default async function EditarBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });

  if (!banner) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Editar banner
      </h1>
      <p className="mt-1 text-sm text-neutral-600">{banner.titulo}</p>

      <EditarBannerForm banner={banner} />

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">Imagen</h2>

        {banner.imagenUrl ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-24 w-40 overflow-hidden rounded-md bg-neutral-100">
              <Image
                src={banner.imagenUrl}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <BorrarImagenBannerForm id={banner.id} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Todavía no tiene imagen.
          </p>
        )}

        <SubirImagenUnica
          accion={subirImagenBanner.bind(null, banner.id)}
          textoBoton={banner.imagenUrl ? "Reemplazar imagen" : "Subir imagen"}
        />
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-red-700">Zona de riesgo</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Borrar este banner no se puede deshacer.
        </p>
        <EliminarBannerForm id={banner.id} titulo={banner.titulo} />
      </section>
    </div>
  );
}
