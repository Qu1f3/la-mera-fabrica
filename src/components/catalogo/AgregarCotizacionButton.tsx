"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartContext";
import { ETIQUETA_UNIDAD, UNIDAD_POR_TIPO } from "@/lib/types";
import type { TipoProducto } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { CalculadoraCobertura } from "./CalculadoraCobertura";

type ProductoParaCarrito = {
  id: string;
  nombre: string;
  slug: string;
  tipo: TipoProducto;
  sku: string | null;
  imagenUrl: string | null;
  categoria: string | null;
  estilo: string | null;
};

/**
 * `compacto` es la versión que va en la tarjeta del catálogo (grid angosto);
 * la versión normal va en la ficha de producto. La cantidad se guarda en la
 * unidad que le corresponde al tipo (m² para mosaico, ml para moldura — el
 * cliente no la elige, ver `UNIDAD_POR_TIPO`).
 *
 * El campo de cantidad es opcional: si el cliente no sabe todavía cuántos
 * m²/ml necesita, puede dejarlo en blanco y pedir cotización igual — el
 * producto se agrega con cantidad "por confirmar" en vez de forzar un
 * número inventado.
 */
export function AgregarCotizacionButton({
  producto,
  compacto = false,
  className = "",
}: {
  producto: ProductoParaCarrito;
  compacto?: boolean;
  className?: string;
}) {
  const { agregarItem } = useCart();
  const router = useRouter();
  const [cantidad, setCantidad] = useState("");
  const unidad = UNIDAD_POR_TIPO[producto.tipo];

  // El usuario pidió que, al agregar un producto, se lleve directo a la
  // pantalla de cotización (antes solo mostraba un "Agregado ✓" y el
  // cliente se quedaba en la misma página, sin saber que ya podía revisar
  // y enviar su solicitud). Se aplica igual desde la ficha de producto y
  // desde la tarjeta del catálogo (`compacto`).
  function agregar() {
    const numero = cantidad.trim() === "" ? null : Number(cantidad);
    const cantidadValida = numero !== null && numero > 0 ? numero : null;

    agregarItem(
      {
        productoId: producto.id,
        nombre: producto.nombre,
        slug: producto.slug,
        tipo: producto.tipo,
        sku: producto.sku,
        imagenUrl: producto.imagenUrl,
        unidad,
        categoria: producto.categoria,
        diseno: producto.estilo,
      },
      cantidadValida
    );
    trackEvent("agregar_cotizacion", {
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      tipo: producto.tipo,
    });
    router.push("/cotizacion");
  }

  return (
    <div
      className={className}
      onClick={(evento) => {
        // Defensa extra por si algún día este componente termina anidado
        // dentro de un <Link> (como en ProductCard) — evita que un clic en
        // el input/botón dispare también la navegación del enlace.
        evento.preventDefault();
        evento.stopPropagation();
      }}
    >
      {/*
        La calculadora va ANTES del campo de cantidad (no debajo, escondida)
        y ahora abierta por defecto (ver `CalculadoraCobertura`) — el
        usuario pidió que tuviera "más protagonismo" en la ficha de
        producto, así que es lo primero que se ve de todo este bloque.
      */}
      {!compacto && (
        <div className="mb-3">
          <CalculadoraCobertura
            tipo={producto.tipo}
            onUsar={(total) => setCantidad(String(total))}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0.5}
          step={0.5}
          value={cantidad}
          onChange={(evento) => setCantidad(evento.target.value)}
          placeholder={compacto ? "Cant." : "Cantidad"}
          className={`rounded-md border border-neutral-300 px-2 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 ${
            compacto ? "w-16" : "w-24"
          }`}
          aria-label={`Cantidad en ${ETIQUETA_UNIDAD[unidad]} (opcional)`}
        />
        <span className="text-sm text-piedra">{ETIQUETA_UNIDAD[unidad]}</span>
        <button
          type="button"
          onClick={agregar}
          className={`flex-1 rounded-md bg-terracota font-medium text-white transition-colors hover:bg-terracota-dark ${
            compacto ? "px-2 py-2 text-sm" : "px-4 py-2.5 text-sm"
          }`}
        >
          {compacto ? "Agregar" : "Agregar a cotización"}
        </button>
      </div>
    </div>
  );
}
