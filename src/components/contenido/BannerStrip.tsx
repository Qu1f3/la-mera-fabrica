import Image from "next/image";
import Link from "next/link";
import type { BannerPublico } from "@/lib/types";

/** No se muestra nada si no hay banners activos — no hay "banner de relleno". */
export function BannerStrip({ banners }: { banners: BannerPublico[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {banners.map((banner) => {
          const contenido = (
            <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white sm:flex-row">
              {banner.imagenUrl && (
                <div className="relative h-32 w-full sm:h-auto sm:w-2/5">
                  <Image
                    src={banner.imagenUrl}
                    alt={banner.titulo}
                    fill
                    sizes="(min-width: 640px) 20vw, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col justify-center gap-1 p-4">
                <p className="text-sm font-semibold text-carbon">
                  {banner.titulo}
                </p>
                {banner.subtitulo && (
                  <p className="text-xs text-piedra">{banner.subtitulo}</p>
                )}
              </div>
            </div>
          );

          return banner.enlace ? (
            <Link
              key={banner.id}
              href={banner.enlace}
              className="block transition-shadow hover:shadow-md"
            >
              {contenido}
            </Link>
          ) : (
            <div key={banner.id}>{contenido}</div>
          );
        })}
      </div>
    </section>
  );
}
