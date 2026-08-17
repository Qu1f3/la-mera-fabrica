"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";

/** Enlace a /cotizacion con el número de productos distintos en el carrito. */
export function CartIndicator() {
  const { items } = useCart();
  const cantidad = items.length;

  return (
    <Link
      href="/cotizacion"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-piedra hover:text-terracota"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-2.293 2.293A1 1 0 005.414 17H17M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
        />
      </svg>
      Cotización
      {cantidad > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracota px-1 text-xs font-semibold text-white">
          {cantidad}
        </span>
      )}
    </Link>
  );
}
