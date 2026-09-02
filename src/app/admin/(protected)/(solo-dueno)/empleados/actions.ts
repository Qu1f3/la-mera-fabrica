"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fechaDesdeInputHonduras } from "@/lib/fecha";
import { registrarAuditoria } from "@/lib/auditoria";

export type EmpleadoFormState = { error?: string };

export async function crearEmpleado(
  _prevState: EmpleadoFormState,
  formData: FormData
): Promise<EmpleadoFormState> {
  await requireAdmin();
  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim() || null;
  const notas = String(formData.get("notas") || "").trim() || null;
  const fechaIngreso = fechaDesdeInputHonduras(formData.get("fechaIngreso"));

  if (!nombre) return { error: "El nombre es obligatorio." };

  const empleado = await prisma.empleado.create({
    data: { nombre, telefono, notas, fechaIngreso },
  });
  await registrarAuditoria({ accion: "crear", entidad: "Empleado", entidadId: empleado.id, detalle: empleado.nombre });

  revalidatePath("/admin/empleados");
  redirect(`/admin/empleados/${empleado.id}`);
}

export async function actualizarEmpleado(
  id: string,
  _prevState: EmpleadoFormState,
  formData: FormData
): Promise<EmpleadoFormState> {
  await requireAdmin();
  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim() || null;
  const notas = String(formData.get("notas") || "").trim() || null;
  const fechaIngreso = fechaDesdeInputHonduras(formData.get("fechaIngreso"));

  if (!nombre) return { error: "El nombre es obligatorio." };

  await prisma.empleado.update({
    where: { id },
    data: { nombre, telefono, notas, fechaIngreso },
  });
  await registrarAuditoria({ accion: "editar", entidad: "Empleado", entidadId: id, detalle: nombre });

  revalidatePath("/admin/empleados");
  revalidatePath(`/admin/empleados/${id}`);
  return {};
}

export async function alternarActivoEmpleado(
  id: string,
  activo: boolean,
  _formData: FormData
) {
  await requireAdmin();
  const empleado = await prisma.empleado.update({ where: { id }, data: { activo } });
  await registrarAuditoria({
    accion: activo ? "activar" : "desactivar",
    entidad: "Empleado",
    entidadId: id,
    detalle: empleado.nombre,
  });
  revalidatePath("/admin/empleados");
  revalidatePath(`/admin/empleados/${id}`);
}

export async function eliminarEmpleado(id: string, _formData: FormData) {
  await requireAdmin();

  const [producciones, mezclas, extras, pagos] = await Promise.all([
    prisma.registroProduccion.count({ where: { empleadoId: id } }),
    prisma.registroMezcla.count({ where: { empleadoId: id } }),
    prisma.pagoExtraEmpleado.count({ where: { empleadoId: id } }),
    prisma.pagoEmpleado.count({ where: { empleadoId: id } }),
  ]);
  const totalRegistros = producciones + mezclas + extras + pagos;

  if (totalRegistros > 0) {
    // No se borra en cascada a propósito: un empleado con historial de
    // producción/pagos no debería poder desaparecer y dejar huérfano ese
    // historial. Se marca inactivo en vez de borrar (ver botón "Desactivar"
    // en la ficha).
    throw new Error(
      `No se puede borrar: este empleado tiene ${totalRegistros} registro(s) de producción/pagos. Desactívalo en vez de borrarlo.`
    );
  }

  const empleado = await prisma.empleado.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Empleado", entidadId: id, detalle: empleado.nombre });
  revalidatePath("/admin/empleados");
  redirect("/admin/empleados");
}
