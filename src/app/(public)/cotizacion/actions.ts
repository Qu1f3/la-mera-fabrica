"use server";

import { prisma } from "@/lib/prisma";
import { buildWhatsAppUrl, mensajeSolicitudCotizacion } from "@/lib/whatsapp";
import { excedioLimite } from "@/lib/rate-limit";
import type { UnidadCotizacion } from "@/lib/types";

export type ItemSolicitud = {
  productoId: string;
  nombre: string;
  // Opcional: el cliente puede pedir cotización sin saber todavía cuántos
  // m²/ml necesita — null significa "por confirmar", no cero.
  cantidad: number | null;
  unidad: UnidadCotizacion;
  // Categoría y diseño del producto (ver ItemCarrito en src/lib/types.ts) —
  // solo se usan para armar un mensaje de WhatsApp más completo, no se
  // guardan en la base de datos (el producto ya queda enlazado por
  // productoId, así que no hace falta duplicar el dato ahí).
  categoria: string | null;
  diseno: string | null;
};

export type DatosCliente = {
  nombreCliente: string;
  telefono: string;
  email?: string;
  notas?: string;
  // Campo trampa ("honeypot"): invisible para una persona real, solo lo
  // llenan los bots que autocompletan cualquier campo del formulario. Si
  // llega con contenido, se descarta la solicitud en silencio.
  sitioWeb?: string;
};

export type ResultadoCotizacion =
  | { ok: true; whatsappUrl: string | null }
  | { ok: false; error: string };

/**
 * Se llama directamente desde un componente cliente (no desde un <form>),
 * porque el carrito vive en localStorage y hace falta mandarlo completo como
 * datos, no como FormData de un formulario HTML. Ver
 * node_modules/next/dist/docs/01-app/02-guides/server-actions.md: es un uso
 * válido de un Server Action siempre que se invoque dentro de un
 * `startTransition` (lo hace CotizacionClient con `useTransition`).
 */
export async function crearSolicitudCotizacion(
  datos: DatosCliente,
  items: ItemSolicitud[]
): Promise<ResultadoCotizacion> {
  // Campo trampa lleno → casi seguro es un bot. Se responde como si hubiera
  // funcionado (sin whatsappUrl) para no delatar la protección, pero no se
  // guarda nada en la base de datos.
  if (datos.sitioWeb?.trim()) {
    return { ok: true, whatsappUrl: null };
  }

  // Límite básico contra envíos masivos automatizados: 5 solicitudes cada
  // 10 minutos por IP. No requiere infraestructura adicional (ver
  // src/lib/rate-limit.ts).
  const bloqueado = await excedioLimite("cotizacion", 5, 10 * 60 * 1000);
  if (bloqueado) {
    return {
      ok: false,
      error:
        "Enviaste varias solicitudes seguidas. Espera unos minutos e inténtalo de nuevo.",
    };
  }

  const nombreCliente = datos.nombreCliente.trim();
  const telefono = datos.telefono.trim();
  const email = datos.email?.trim() || null;
  const notas = datos.notas?.trim() || null;

  if (!nombreCliente) {
    return { ok: false, error: "Escribe tu nombre." };
  }
  if (!telefono) {
    return { ok: false, error: "Escribe un teléfono de contacto." };
  }
  if (items.length === 0) {
    return {
      ok: false,
      error: "Tu cotización está vacía — agrega al menos un producto.",
    };
  }

  // Un producto es válido con o sin cantidad — solo hace falta saber cuál
  // producto es. La cantidad ("por confirmar" si es null) se guarda tal cual.
  const itemsValidos = items.filter((item) => item.productoId);

  if (itemsValidos.length === 0) {
    return {
      ok: false,
      error: "Tu cotización está vacía — agrega al menos un producto.",
    };
  }

  const config = await prisma.configuracion.findUnique({
    where: { id: "global" },
  });

  await prisma.solicitudCotizacion.create({
    data: {
      nombreCliente,
      telefono,
      email,
      notas,
      items: {
        create: itemsValidos.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          unidad: item.unidad,
        })),
      },
    },
  });

  const mensaje = mensajeSolicitudCotizacion({
    nombreCliente,
    items: itemsValidos,
  });
  const whatsappUrl = buildWhatsAppUrl(config?.whatsappNumero, mensaje);

  return { ok: true, whatsappUrl };
}
