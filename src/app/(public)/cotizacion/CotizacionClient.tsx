"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { ETIQUETA_UNIDAD } from "@/lib/types";
import { piezasDeMosaico } from "@/lib/cobertura";
import { trackEvent } from "@/lib/analytics";
import { crearSolicitudCotizacion } from "./actions";

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-terracota focus:outline-none";

export function CotizacionClient() {
  const { items, actualizarCantidad, quitarItem, vaciar } = useCart();
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [sitioWeb, setSitioWeb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    startTransition(async () => {
      const resultado = await crearSolicitudCotizacion(
        { nombreCliente, telefono, email, notas, sitioWeb },
        items.map((item) => ({
          productoId: item.productoId,
          nombre: item.nombre,
          cantidad: item.cantidad,
          unidad: item.unidad,
          sku: item.sku,
          categoria: item.categoria,
          diseno: item.diseno,
        }))
      );

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }

      trackEvent("enviar_cotizacion", { items_count: items.length });
      vaciar();

      // Navegación directa (no window.open) para evitar que el navegador la
      // bloquee como pop-up: ya pasó tiempo async desde el clic original.
      window.location.href = resultado.whatsappUrl ?? "/cotizacion/gracias";
    });
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-carbon">
          Tu cotización está vacía
        </h1>
        <p className="mt-2 text-sm text-piedra">
          Agrega productos desde el catálogo para armar tu solicitud.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-terracota px-5 py-2.5 text-sm font-medium text-white hover:bg-terracota-dark"
        >
          Ver catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon">Tu cotización</h1>
      <p className="mt-1 text-sm text-piedra">
        Revisa los productos, ajusta las cantidades y déjanos tus datos —
        respondemos por WhatsApp con precio y disponibilidad.
      </p>

      <ul className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {items.map((item) => (
          <li key={item.productoId} className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <Link
                href={`/productos/${item.slug}`}
                className="text-sm font-medium text-carbon hover:underline"
              >
                {item.nombre}
              </Link>
              {(item.sku || item.categoria || item.diseno) && (
                <p className="text-sm text-piedra">
                  {[
                    item.sku ? `Código: ${item.sku}` : null,
                    item.categoria ? `Categoría: ${item.categoria}` : null,
                    item.diseno ? `Diseño: ${item.diseno}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {item.unidad === "M2" && item.cantidad != null && (
                <p className="text-sm text-piedra">
                  ≈ {piezasDeMosaico(item.cantidad)} piezas
                </p>
              )}
            </div>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={item.cantidad ?? ""}
              onChange={(evento) => {
                const texto = evento.target.value;
                actualizarCantidad(
                  item.productoId,
                  texto.trim() === "" ? null : Number(texto)
                );
              }}
              placeholder="¿Cuántos?"
              className="w-24 rounded-md border border-neutral-300 px-2 py-2 text-sm text-neutral-900 placeholder:text-sm placeholder:text-neutral-400"
              aria-label={`Cantidad de ${item.nombre} (opcional)`}
            />
            <span className="w-6 text-sm text-piedra">
              {ETIQUETA_UNIDAD[item.unidad]}
            </span>
            <button
              type="button"
              onClick={() => quitarItem(item.productoId)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-piedra">
        ¿No sabes cuántos metros cuadrados (m²) o metros lineales (ml)
        necesitas todavía? Puedes dejar la cantidad en blanco — igual
        recibimos tu solicitud.
      </p>

      <form
        onSubmit={enviar}
        className="mt-8 space-y-4 rounded-lg border border-neutral-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-carbon">Tus datos</h2>

        {/* Campo trampa para bots: oculto de forma visual y para lectores de
            pantalla, pero presente en el HTML — un bot que autocompleta
            formularios suele llenarlo igual. Una persona real nunca lo ve
            ni lo toca. Ver src/app/(public)/cotizacion/actions.ts. */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        >
          <label>
            No llenar este campo
            <input
              type="text"
              name="sitioWeb"
              tabIndex={-1}
              autoComplete="off"
              value={sitioWeb}
              onChange={(evento) => setSitioWeb(evento.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm text-piedra">
            Nombre *
            <input
              required
              value={nombreCliente}
              onChange={(evento) => setNombreCliente(evento.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-piedra">
            Teléfono *
            <input
              required
              value={telefono}
              onChange={(evento) => setTelefono(evento.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-piedra sm:col-span-2">
            Correo (opcional)
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-piedra sm:col-span-2">
            Notas (opcional)
            <textarea
              value={notas}
              onChange={(evento) => setNotas(evento.target.value)}
              rows={3}
              className={inputClass}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-terracota px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracota-dark disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Enviando…" : "Enviar solicitud por WhatsApp"}
        </button>
      </form>
    </main>
  );
}
