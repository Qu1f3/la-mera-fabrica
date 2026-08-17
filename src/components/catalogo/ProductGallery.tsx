"use client";

import { useState } from "react";
import Image from "next/image";
import type { ImagenResumen, TipoProducto } from "@/lib/types";
import { ImagenPlaceholder } from "./ImagenPlaceholder";

export function ProductGallery({
  imagenes,
  tipo,
  nombre,
  patternId,
}: {
  imagenes: ImagenResumen[];
  tipo: TipoProducto;
  nombre: string;
  patternId: string;
}) {
  const [activaIndex, setActivaIndex] = useState(0);

  if (imagenes.length === 0) {
    return (
      <ImagenPlaceholder
        tipo={tipo}
        patternId={patternId}
        className="aspect-square w-full rounded-lg"
      />
    );
  }

  const activa = imagenes[activaIndex] ?? imagenes[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-arena">
        <Image
          src={activa.url}
          alt={activa.alt || nombre}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      </div>

      {imagenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {imagenes.map((imagen, indice) => (
            <button
              key={imagen.id}
              type="button"
              onClick={() => setActivaIndex(indice)}
              aria-label={`Ver foto ${indice + 1} de ${nombre}`}
              aria-current={indice === activaIndex}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md ring-2 transition ${
                indice === activaIndex
                  ? "ring-terracota"
                  : "ring-transparent hover:ring-neutral-300"
              }`}
            >
              <Image
                src={imagen.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
