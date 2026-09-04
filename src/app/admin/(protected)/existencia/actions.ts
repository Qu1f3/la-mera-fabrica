"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type ExistenciaFormState = { error?: string };

function validarCantidad(texto: string): { error: string } | { cantidad: number } {
  const cantidad = Number(texto.trim());
  if (!Number.isFinite(cantidad) || !Number.isInteger(cantidad) || cantidad < 0) {
    return { error: "La cantidad debe ser un número entero mayor o igual a 0." };
  }
  return { cantidad };
}

export async function crearExistencia(
  _prevState: ExistenciaFormState,
  formData: FormData
): Promise<ExistenciaFormState> {
  await requireAdmin();

  const productoId = String(formData.get("productoId") || "").trim();
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!productoId) return { error: "Selecciona el mosaico." };

  const resultado = validarCantidad(String(formData.get("cantidad") || ""));
  if ("error" in resultado) return resultado;

  const [producto, existente] = await Promise.all([
    prisma.producto.findUnique({ where: { id: productoId }, select: { nombre: true } }),
    prisma.existenciaMosaico.findUnique({ where: { productoId } }),
  ]);
  if (!producto) return { error: "Ese producto ya no existe." };
  if (existente) {
    return { error: "Este mosaico ya tiene existencia registrada -- edítala en vez de crear otra." };
  }

  const existencia = await prisma.existenciaMosaico.create({
    data: { productoId, cantidad: resultado.cantidad, notas },
  });
  await registrarAuditoria({
    accion: "crear",
    entidad: "ExistenciaMosaico",
    entidadId: existencia.id,
    detalle: `${producto.nombre}: ${resultado.cantidad}`,
  });

  revalidatePath("/admin/existencia");
  redirect("/admin/existencia");
}

export async function actualizarExistencia(
  id: string,
  _prevState: ExistenciaFormState,
  formData: FormData
): Promise<ExistenciaFormState> {
  await requireAdmin();

  const notas = String(formData.get("notas") || "").trim() || null;

  const resultado = validarCantidad(String(formData.get("cantidad") || ""));
  if ("error" in resultado) return resultado;

  const existencia = await prisma.existenciaMosaico.findUnique({
    where: { id },
    include: { producto: { select: { nombre: true } } },
  });
  if (!existencia) return { error: "Este registro ya no existe." };

  await prisma.existenciaMosaico.update({
    where: { id },
    data: { cantidad: resultado.cantidad, notas },
  });
  await registrarAuditoria({
    accion: "editar",
    entidad: "ExistenciaMosaico",
    entidadId: id,
    detalle: `${existencia.producto.nombre}: ${resultado.cantidad}`,
  });

  revalidatePath("/admin/existencia");
  revalidatePath(`/admin/existencia/${id}`);
  return {};
}

export async function eliminarExistencia(id: string, _formData: FormData) {
  await requireAdmin();

  const existencia = await prisma.existenciaMosaico.delete({
    where: { id },
    include: { producto: { select: { nombre: true } } },
  });
  await registrarAuditoria({
    accion: "eliminar",
    entidad: "ExistenciaMosaico",
    entidadId: id,
    detalle: existencia.producto.nombre,
  });

  revalidatePath("/admin/existencia");
  redirect("/admin/existencia");
}
