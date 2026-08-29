"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type ClienteFormState = { error?: string };

/**
 * Crea un cliente. Se usa tanto desde /admin/clientes como desde el
 * formulario de creación de pedido ("Debe ser posible crear un cliente
 * directamente desde el formulario de pedido") -- por eso devuelve el
 * cliente creado en vez de solo redirigir, para que quien la llame decida
 * qué hacer después (ir a la ficha del cliente, o seguir armando el
 * pedido).
 */
export async function crearCliente(
  _prevState: ClienteFormState,
  formData: FormData
): Promise<ClienteFormState> {
  await requireAdmin();
  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!telefono) return { error: "El teléfono es obligatorio." };

  const cliente = await prisma.cliente.create({
    data: { nombre, telefono, notas },
  });

  revalidatePath("/admin/clientes");
  redirect(`/admin/clientes/${cliente.id}`);
}

export async function actualizarCliente(
  id: string,
  _prevState: ClienteFormState,
  formData: FormData
): Promise<ClienteFormState> {
  await requireAdmin();
  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!telefono) return { error: "El teléfono es obligatorio." };

  await prisma.cliente.update({
    where: { id },
    data: { nombre, telefono, notas },
  });

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${id}`);
  return {};
}

export async function eliminarCliente(id: string, _formData: FormData) {
  await requireAdmin();

  const pedidos = await prisma.pedido.count({ where: { clienteId: id } });
  if (pedidos > 0) {
    // No se borra en cascada a propósito: un cliente con pedidos reales no
    // debería poder desaparecer y dejar huérfano su historial. La base de
    // datos también lo impediría (constraint de la relación), pero se
    // revisa antes para poder mostrar un mensaje claro en español.
    throw new Error(
      `No se puede borrar: este cliente tiene ${pedidos} pedido(s) registrado(s).`
    );
  }

  const cliente = await prisma.cliente.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Cliente", entidadId: id, detalle: cliente.nombre });
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export type ClienteInlineState = {
  error?: string;
  cliente?: { id: string; nombre: string; telefono: string };
};

/**
 * Variante de crearCliente que NO redirige -- la usa el formulario de
 * creación de pedido para poder crear un cliente nuevo sin abandonar el
 * pedido que se está armando ("Debe ser posible crear un cliente
 * directamente desde el formulario de pedido").
 */
export async function crearClienteInline(
  _prevState: ClienteInlineState,
  formData: FormData
): Promise<ClienteInlineState> {
  await requireAdmin();
  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!telefono) return { error: "El teléfono es obligatorio." };

  const cliente = await prisma.cliente.create({ data: { nombre, telefono } });
  revalidatePath("/admin/clientes");

  return {
    cliente: { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono },
  };
}
