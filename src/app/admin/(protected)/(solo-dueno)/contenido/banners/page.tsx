import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Banners — Panel administrativo" };

export default async function BannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { orden: "asc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Banners</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Se muestran en la página de inicio mientras estén activos (y
            dentro de sus fechas, si les pusiste alguna).
          </p>
        </div>
        <Link
          href="/admin/contenido/banners/nuevo"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Nuevo banner
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3" />
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {banners.map((banner) => (
              <tr key={banner.id}>
                <td className="px-4 py-3">
                  <div className="h-10 w-16 overflow-hidden rounded bg-neutral-100">
                    {banner.imagenUrl && (
                      <Image
                        src={banner.imagenUrl}
                        alt=""
                        width={64}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {banner.titulo}
                </td>
                <td className="px-4 py-3 text-neutral-600">{banner.orden}</td>
                <td className="px-4 py-3">
                  {banner.activo ? (
                    <span className="text-green-700">Activo</span>
                  ) : (
                    <span className="text-neutral-400">Inactivo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/contenido/banners/${banner.id}`}
                    className="font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Todavía no hay banners.{" "}
                  <Link
                    href="/admin/contenido/banners/nuevo"
                    className="font-medium text-neutral-700 underline"
                  >
                    Crea el primero
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
