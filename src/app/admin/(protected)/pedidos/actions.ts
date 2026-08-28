"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { obtenerAdminUsuario } from "@/lib/supabase/adminUsuario";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generarCodigoPedido } from "@/lib/pedidoCodigo";
import { calcularSubtotal, calcularTotalesPedido } from "@/lib/pedidoTotales";
import type { EstadoPedido, EstadoEntrega, ItemPedidoFormulario } from "@/lib/types";

export type PedidoFormState = { error?: string };

function fechaDesdeInput(valor: FormDataEntryValue | null): Date | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  // Los <input type="date"> mandan "YYYY-MM-DD" -- se arma a medianoche
  // local para no depender de a qué hora corre el servidor.
  const fecha = new Date(`${texto}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function parsearItems(valor: FormDataEntryValue | null): ItemPedidoFormulario[] | null {
  try {
    const items = JSON.parse(String(valor ?? "[]"));
    if (!Array.isArray(items)) return null;
    for (const item of items) {
      if (
        !item ||
        typeof item.productoId !== "string" ||
        !item.productoId ||
        typeof item.cantidad !== "number" ||
        !(item.cantidad > 0) ||
        typeof item.precioUnitario !== "number" ||
        item.precioUnitario < 0
      ) {
        return null;
      }
    }
    return items as ItemPedidoFormulario[];
  } catch {
    return null;
  }
}

export async function crearPedido(
  _prevState: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  const user = await requireAdmin();

  const clienteId = String(formData.get("clienteId") || "").trim();
  if (!clienteId) return { error: "Selecciona o crea un cliente." };

  const items = parsearItems(formData.get("itemsJson"));
  if (!items || items.length === 0) {
    return { error: "Agrega al menos un producto con cantidad y precio válidos." };
  }

  // El anticipo normalmente es un % del total, pero a veces el cliente deja
  // un monto cerrado que no corresponde a ningún porcentaje redondo (ej:
  // "hoy dejó L.3,000") -- modoAnticipo decide cuál de los dos números de
  // abajo se usa (ver src/lib/pedidoTotales.ts).
  const modoAnticipo = String(formData.get("modoAnticipo") || "PORCENTAJE");
  let entradaAnticipo: Parameters<typeof calcularTotalesPedido>[1];

  if (modoAnticipo === "MONTO_FIJO") {
    const montoAnticipoFijo = Number(formData.get("montoAnticipoFijo"));
    if (!Number.isFinite(montoAnticipoFijo) || montoAnticipoFijo < 0) {
      return { error: "El monto de anticipo no es válido." };
    }
    const montoTotalItems = items.reduce(
      (suma, item) => suma + item.cantidad * item.precioUnitario,
      0
    );
    if (montoAnticipoFijo > montoTotalItems) {
      return { error: "El anticipo no puede ser mayor que el total del pedido." };
    }
    entradaAnticipo = { modo: "MONTO_FIJO", monto: montoAnticipoFijo };
  } else {
    const porcentajeAnticipoRaw = Number(formData.get("porcentajeAnticipo"));
    const porcentajeAnticipo = Number.isFinite(porcentajeAnticipoRaw)
      ? porcentajeAnticipoRaw
      : 60;
    if (porcentajeAnticipo < 0 || porcentajeAnticipo > 100) {
      return { error: "El porcentaje de anticipo debe estar entre 0 y 100." };
    }
    entradaAnticipo = { modo: "PORCENTAJE", porcentaje: porcentajeAnticipo };
  }

  const fechaPrometida = fechaDesdeInput(formData.get("fechaPrometida"));
  const notas = String(formData.get("notas") || "").trim() || null;

  const adminUsuario = await obtenerAdminUsuario(user);
  const { montoTotal, montoAnticipo, porcentajeAnticipo, saldoPendiente } =
    calcularTotalesPedido(items, entradaAnticipo);
  const codigo = await generarCodigoPedido();

  const pedido = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.pedido.create({
      data: {
        codigo,
        clienteId,
        fechaPrometida,
        porcentajeAnticipo,
        montoAnticipo,
        montoTotal,
        saldoPendiente,
        notas,
        items: {
          create: items.map((item) => ({
            productoId: item.productoId,
            categoria: item.categoria || null,
            diseno: item.diseno || null,
            color: item.color || null,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: calcularSubtotal(item.cantidad, item.precioUnitario),
          })),
        },
        historial: {
          create: { estado: "PEDIDO_RECIBIDO", adminUsuarioId: adminUsuario.id },
        },
      },
    });

    // Ingreso automático: el anticipo de un pedido nuevo ES un ingreso, no
    // hace falta que alguien lo vuelva a escribir en Finanzas. Ver
    // cambiarEstadoPedido para el ingreso del pago final al entregar.
    if (montoAnticipo > 0) {
      await tx.ingreso.create({
        data: {
          categoria: "ANTICIPO",
          monto: montoAnticipo,
          fecha: new Date(),
          pedidoId: nuevo.id,
          descripcion: `Anticipo de pedido ${codigo}`,
        },
      });
    }

    return nuevo;
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/clientes/${clienteId}`);
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  redirect(`/admin/pedidos/${pedido.id}`);
}

export async function cambiarEstadoPedido(pedidoId: string, formData: FormData) {
  const user = await requireAdmin();
  const adminUsuario = await obtenerAdminUsuario(user);

  const estado = String(formData.get("estado") || "") as EstadoPedido;
  const notas = String(formData.get("notas") || "").trim() || null;

  await prisma.$transaction(async (tx) => {
    const pedidoActual = await tx.pedido.findUniqueOrThrow({ where: { id: pedidoId } });

    const data: Prisma.PedidoUpdateInput = { estado };
    // Estos dos campos se completan solos al llegar al estado correspondiente
    // -- nunca se piden a mano (ver instrucción: "no introducir manualmente
    // los días transcurridos").
    if (estado === "EN_SECADO") data.fechaInicioSecado = new Date();
    if (estado === "ENTREGADO") data.fechaEntregaReal = new Date();

    await tx.pedido.update({ where: { id: pedidoId }, data });
    await tx.historialEstadoPedido.create({
      data: { pedidoId, estado, adminUsuarioId: adminUsuario.id, notas },
    });

    // Ingreso automático: al llegar a ENTREGADO se asume cobrado el saldo
    // que quedaba pendiente. Se busca primero para no duplicarlo si el
    // pedido pasa por ENTREGADO más de una vez (se corrige el estado y se
    // vuelve a marcar).
    if (estado === "ENTREGADO" && Number(pedidoActual.saldoPendiente) > 0) {
      const yaExiste = await tx.ingreso.findFirst({
        where: { pedidoId, categoria: "PAGO_FINAL" },
      });
      if (!yaExiste) {
        await tx.ingreso.create({
          data: {
            categoria: "PAGO_FINAL",
            monto: pedidoActual.saldoPendiente,
            fecha: new Date(),
            pedidoId,
            descripcion: `Pago final de pedido ${pedidoActual.codigo}`,
          },
        });
      }
    }
  });

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
}

export async function asignarFechaPrometida(pedidoId: string, formData: FormData) {
  await requireAdmin();
  const fechaPrometida = fechaDesdeInput(formData.get("fechaPrometida"));
  if (!fechaPrometida) return;

  await prisma.pedido.update({ where: { id: pedidoId }, data: { fechaPrometida } });
  revalidatePath(`/admin/pedidos/${pedidoId}`);
  revalidatePath("/admin/pedidos");
}

export async function registrarRiego(pedidoId: string, formData: FormData) {
  const user = await requireAdmin();
  const adminUsuario = await obtenerAdminUsuario(user);
  const observacion = String(formData.get("observacion") || "").trim() || null;

  await prisma.registroRiego.create({
    data: { pedidoId, adminUsuarioId: adminUsuario.id, observacion },
  });

  revalidatePath(`/admin/pedidos/${pedidoId}`);
}

// Programar/completar la entrega de un pedido es independiente de
// "Cambiar estado" del pedido (que ya marca fechaEntregaReal solo al pasar
// a ENTREGADO) -- Entrega existe aparte para poder programar la fecha con
// anticipación y para el caso (raro) de que un pedido se reparta en varias
// tandas de entrega.
export async function crearEntrega(pedidoId: string, formData: FormData) {
  await requireAdmin();
  const fechaProgramada = fechaDesdeInput(formData.get("fechaProgramada"));
  const notas = String(formData.get("notas") || "").trim() || null;

  await prisma.entrega.create({ data: { pedidoId, fechaProgramada, notas } });

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  revalidatePath("/admin/calendario");
}

export async function actualizarEstadoEntrega(entregaId: string, formData: FormData) {
  await requireAdmin();
  const estado = String(formData.get("estado") || "") as EstadoEntrega;
  const notas = String(formData.get("notas") || "").trim() || null;

  const entregaActual = await prisma.entrega.findUnique({ where: { id: entregaId } });
  if (!entregaActual) return;

  await prisma.entrega.update({
    where: { id: entregaId },
    data: {
      estado,
      notas,
      // Se completa sola al marcar ENTREGADO, igual que fechaEntregaReal
      // del pedido -- nunca se pide a mano. Si ya tenía fecha real (por si
      // se vuelve a marcar ENTREGADO) no se pisa.
      fechaReal:
        estado === "ENTREGADO" && !entregaActual.fechaReal ? new Date() : undefined,
    },
  });

  revalidatePath(`/admin/pedidos/${entregaActual.pedidoId}`);
  revalidatePath("/admin/calendario");
}

export async function eliminarEntrega(entregaId: string, _formData: FormData) {
  await requireAdmin();
  const entrega = await prisma.entrega.delete({ where: { id: entregaId } });
  revalidatePath(`/admin/pedidos/${entrega.pedidoId}`);
  revalidatePath("/admin/calendario");
}

export async function eliminarPedido(id: string, _formData: FormData) {
  await requireAdmin();
  // Los ingresos ya registrados no se borran -- solo se desvinculan de este
  // pedido, para no perder el historial financiero.
  await prisma.ingreso.updateMany({ where: { pedidoId: id }, data: { pedidoId: null } });
  await prisma.pedido.delete({ where: { id } });
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}
