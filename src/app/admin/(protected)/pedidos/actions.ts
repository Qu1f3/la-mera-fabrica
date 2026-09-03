"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { obtenerAdminUsuario } from "@/lib/supabase/adminUsuario";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { registrarPedidoCompartido, type ItemPedidoInput } from "@/lib/pedidos/crear";
import { cambiarEstadoPedidoCompartido } from "@/lib/pedidos/estado";
import { asignarFechaPrometidaCompartido } from "@/lib/pedidos/fecha";
import { registrarRiegoCompartido } from "@/lib/pedidos/riego";
import { crearEntregaCompartido } from "@/lib/pedidos/entrega";
import type { EstadoPedido, EstadoEntrega } from "@/lib/types";

export type PedidoFormState = { error?: string };

function parsearItems(valor: FormDataEntryValue | null): ItemPedidoInput[] | null {
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
    return items as ItemPedidoInput[];
  } catch {
    return null;
  }
}

/**
 * Se deja funcionando (mismo contrato de FormData de siempre) pero ya no
 * la llama el formulario -- ver NuevoPedidoForm.tsx, que ahora pasa por
 * la cola sin conexión (src/lib/offline/sync.ts) contra
 * /api/offline/pedidos, que es quien de verdad usa
 * registrarPedidoCompartido hoy. Ver propuesta-modo-offline.md, Fase 4.
 */
export async function crearPedido(
  _prevState: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  const user = await requireAdmin();
  const adminUsuario = await obtenerAdminUsuario(user);

  const clienteId = String(formData.get("clienteId") || "").trim();
  if (!clienteId) return { error: "Selecciona o crea un cliente." };

  const items = parsearItems(formData.get("itemsJson"));
  if (!items || items.length === 0) {
    return { error: "Agrega al menos un producto con cantidad y precio válidos." };
  }

  const modoAnticipo = String(formData.get("modoAnticipo") || "PORCENTAJE") as
    | "PORCENTAJE"
    | "MONTO_FIJO";
  const porcentajeAnticipo = Number(formData.get("porcentajeAnticipo"));
  const montoAnticipoFijo = Number(formData.get("montoAnticipoFijo"));
  const fechaPrometidaInput = String(formData.get("fechaPrometida") || "");
  const notas = String(formData.get("notas") || "").trim() || null;

  const resultado = await registrarPedidoCompartido({
    adminUsuarioId: adminUsuario.id,
    clienteId,
    items,
    modoAnticipo,
    porcentajeAnticipo,
    montoAnticipoFijo,
    fechaPrometidaInput,
    notas,
  });

  if (resultado.error) return { error: resultado.error };

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/clientes/${clienteId}`);
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  redirect(`/admin/pedidos/${resultado.pedidoId}`);
}

export async function cambiarEstadoPedido(
  pedidoId: string,
  _prevState: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  const user = await requireAdmin();
  const adminUsuario = await obtenerAdminUsuario(user);

  const estado = String(formData.get("estado") || "") as EstadoPedido;
  const notas = String(formData.get("notas") || "").trim() || null;

  const resultado = await cambiarEstadoPedidoCompartido({
    pedidoId,
    estado,
    notas,
    adminUsuarioId: adminUsuario.id,
  });

  // Con conexión (este formulario/Server Action) no debería poder chocar
  // -- no hay versionEsperada de por medio -- pero se cubre el caso por
  // las dudas en vez de dejarlo pasar como éxito silencioso.
  if (resultado.conflicto) {
    return { error: "Alguien más cambió este pedido. Actualiza la página e intenta de nuevo." };
  }
  if (resultado.error) return { error: resultado.error };

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  return {};
}

export async function asignarFechaPrometida(
  pedidoId: string,
  _prevState: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  await requireAdmin();
  const fechaPrometidaInput = String(formData.get("fechaPrometida") || "");

  const resultado = await asignarFechaPrometidaCompartido({ pedidoId, fechaPrometidaInput });

  if (resultado.conflicto) {
    return { error: "Alguien más cambió este pedido. Actualiza la página e intenta de nuevo." };
  }
  if (resultado.error) return { error: resultado.error };

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  revalidatePath("/admin/pedidos");
  return {};
}

export async function registrarRiego(
  pedidoId: string,
  _prevState: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  const user = await requireAdmin();
  const adminUsuario = await obtenerAdminUsuario(user);
  const observacion = String(formData.get("observacion") || "").trim() || null;

  const resultado = await registrarRiegoCompartido({
    pedidoId,
    adminUsuarioId: adminUsuario.id,
    observacion,
  });

  if (resultado.error) return { error: resultado.error };

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  return {};
}

// Programar/completar la entrega de un pedido es independiente de
// "Cambiar estado" del pedido (que ya marca fechaEntregaReal solo al pasar
// a ENTREGADO) -- Entrega existe aparte para poder programar la fecha con
// anticipación y para el caso (raro) de que un pedido se reparta en varias
// tandas de entrega.
export async function crearEntrega(
  pedidoId: string,
  _prevState: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  await requireAdmin();
  const fechaProgramadaInput = String(formData.get("fechaProgramada") || "");
  const notas = String(formData.get("notas") || "").trim() || null;

  const resultado = await crearEntregaCompartido({ pedidoId, fechaProgramadaInput, notas });

  if (resultado.error) return { error: resultado.error };

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  revalidatePath("/admin/calendario");
  return {};
}

export async function actualizarEstadoEntrega(
  entregaId: string,
  _prevState: PedidoFormState,
  formData: FormData
): Promise<PedidoFormState> {
  await requireAdmin();
  const estado = String(formData.get("estado") || "") as EstadoEntrega;
  const notas = String(formData.get("notas") || "").trim() || null;

  const entregaActual = await prisma.entrega.findUnique({ where: { id: entregaId } });
  if (!entregaActual) return { error: "Esta entrega ya no existe." };

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

  await registrarAuditoria({ accion: "cambiar_estado", entidad: "Entrega", entidadId: entregaId, detalle: estado });

  revalidatePath(`/admin/pedidos/${entregaActual.pedidoId}`);
  revalidatePath("/admin/calendario");
  return {};
}

export async function eliminarEntrega(
  entregaId: string,
  _prevState: PedidoFormState,
  _formData: FormData
): Promise<PedidoFormState> {
  await requireAdmin();
  const entrega = await prisma.entrega.delete({ where: { id: entregaId } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Entrega", entidadId: entregaId, detalle: entrega.pedidoId });
  revalidatePath(`/admin/pedidos/${entrega.pedidoId}`);
  revalidatePath("/admin/calendario");
  return {};
}

export async function eliminarPedido(
  id: string,
  _prevState: PedidoFormState,
  _formData: FormData
): Promise<PedidoFormState> {
  await requireAdmin();
  // Los ingresos ya registrados no se borran -- solo se desvinculan de este
  // pedido, para no perder el historial financiero.
  await prisma.ingreso.updateMany({ where: { pedidoId: id }, data: { pedidoId: null } });
  const pedido = await prisma.pedido.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Pedido", entidadId: id, detalle: pedido.codigo });
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}
