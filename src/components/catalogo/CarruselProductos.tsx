"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductoRelacionadoResumen } from "@/lib/types";
import { ProductCard } from "./ProductCard";

/**
 * El usuario pidió que "También te puede interesar" / "Moldura a juego" en
 * la ficha de producto fuera una sola línea que se navegue con flechas, en
 * vez de un grid que crece hacia abajo en varias filas (antes
 * `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`). Con el catálogo real
 * (menos de 50 productos, pocos relacionados por producto) una sola fila
 * horizontal alcanza y se ve más ordenado.
 *
 * Las tarjetas usan `ProductCard` tal cual (mismo componente que el
 * catálogo) para no duplicar su diseño — solo cambia el contenedor que las
 * envuelve.
 */
export function CarruselProductos({
  productos,
}: {
  productos: ProductoRelacionadoResumen[];
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [puedeIzquierda, setPuedeIzquierda] = useState(false);
  const [puedeDerecha, setPuedeDerecha] = useState(false);

  function actualizarFlechas() {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    setPuedeIzquierda(contenedor.scrollLeft > 4);
    setPuedeDerecha(
      contenedor.scrollLeft + contenedor.clientWidth <
        contenedor.scrollWidth - 4
    );
  }

  // Al montar (o si cambia la lista de productos) hay que revisar si ya
  // arranca con más contenido del que cabe, para mostrar la flecha derecha
  // desde el principio.
  useEffect(() => {
    actualizarFlechas();
  }, [productos]);

  function desplazar(direccion: 1 | -1) {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    // Avanza casi una "pantalla" de tarjetas por clic, no un scroll chico.
    contenedor.scrollBy({
      left: direccion * contenedor.clientWidth * 0.9,
      behavior: "smooth",
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => desplazar(-1)}
        disabled={!puedeIzquierda}
        aria-label="Ver productos anteriores"
        className="flex shrink-0 rounded-full border border-neutral-200 bg-white p-2 text-carbon shadow-sm hover:bg-arena disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/*
        Fila horizontal con scroll propio (no un grid que envuelve hacia
        abajo). `snap-x` hace que cada clic en las flechas termine con una
        tarjeta bien alineada al borde, no a la mitad. La barra de scroll se
        oculta visualmente (sigue siendo navegable con touch/trackpad) para
        que la única forma "visible" de moverse sean las flechas.
      */}
      <div
        ref={contenedorRef}
        onScroll={actualizarFlechas}
        className="flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {productos.map((r) => (
          <div key={r.id} className="w-40 shrink-0 snap-start sm:w-48">
            <ProductCard producto={r} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => desplazar(1)}
        disabled={!puedeDerecha}
        aria-label="Ver más productos"
        className="flex shrink-0 rounded-full border border-neutral-200 bg-white p-2 text-carbon shadow-sm hover:bg-arena disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
