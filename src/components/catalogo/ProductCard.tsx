import Image from "next/image";
import Link from "next/link";
import type { ProductoTarjeta } from "@/lib/types";
import { ETIQUETA_TIPO } from "@/lib/types";
import { ImagenPlaceholder } from "./ImagenPlaceholder";
import { DisponibilidadBadge } from "./DisponibilidadBadge";
import { AgregarCotizacionButton } from "./AgregarCotizacionButton";

export function ProductCard({ producto }: { producto: ProductoTarjeta }) {
  const imagen = producto.imagenes[0];

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/productos/${producto.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square w-full">
          {imagen ? (
            <Image
              src={imagen.url}
              alt={imagen.alt || producto.nombre}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <ImagenPlaceholder
              tipo={producto.tipo}
              patternId={`tarjeta-${producto.id}`}
              className="h-full w-full"
            />
          )}
          {producto.destacado && (
            <span className="absolute left-2 top-2 rounded-full bg-terracota px-2.5 py-0.5 text-xs font-medium text-white">
              Destacado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4 pb-3">
          <span className="text-xs font-medium uppercase tracking-wide text-piedra">
            {ETIQUETA_TIPO[producto.tipo]}
            {producto.categoria ? ` · ${producto.categoria.nombre}` : ""}
          </span>
          <h3 className="text-sm font-semibold text-carbon">
            {producto.nombre}
          </h3>
          {(producto.estilo || producto.acabado) && (
            <p className="text-xs text-piedra">
              {[producto.estilo, producto.acabado].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="mt-auto pt-2">
            <DisponibilidadBadge disponibilidad={producto.disponibilidad} />
          </div>
        </div>
      </Link>

      {/*
        Fuera del <Link> a propósito: es un input + botón interactivos, y el
        HTML no permite controles de formulario anidados dentro de un <a>.
      */}
      <div className="border-t border-neutral-100 p-3 pt-2.5">
        <AgregarCotizacionButton
          producto={{
            id: producto.id,
            nombre: producto.nombre,
            slug: producto.slug,
            tipo: producto.tipo,
            sku: producto.sku,
            imagenUrl: imagen?.url ?? null,
          }}
          compacto
        />
      </div>
    </div>
  );
}
