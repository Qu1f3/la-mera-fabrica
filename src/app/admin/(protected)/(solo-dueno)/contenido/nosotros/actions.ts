"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { subirImagenContenido, borrarImagenContenido } from "@/lib/storage";
import { registrarAuditoria } from "@/lib/auditoria";

const CLAVE = "nosotros";

export type EstadoNosotros = { error?: string };

export async function actualizarNosotros(
  _prevState: EstadoNosotros,
  formData: FormData
): Promise<EstadoNosotros> {
  await requireAdmin();
  const titulo = String(formData.get("titulo") || "").trim() || "Nosotros";
  const cuerpo = String(formData.get("cuerpo") || "").trim() || null;

  await prisma.seccionContenido.upsert({
    where: { clave: CLAVE },
    create: { clave: CLAVE, titulo, cuerpo },
    update: { titulo, cuerpo },
  });
  await registrarAuditoria({ accion: "editar", entidad: "SeccionContenido", entidadId: CLAVE, detalle: titulo });

  revalidatePath("/admin/contenido/nosotros");
  revalidatePath("/nosotros");
  return {};
}

export async function subirImagenNosotros(formData: FormData) {
  await requireAdmin();
  const archivo = formData.get("imagen");
  if (!(archivo instanceof File) || archivo.size === 0) return;

  const existente = await prisma.seccionContenido.findUnique({
    where: { clave: CLAVE },
    select: { imagenUrl: true },
  });

  if (existente?.imagenUrl) {
    await borrarImagenContenido(existente.imagenUrl);
  }

  const subida = await subirImagenContenido(CLAVE, archivo);

  await prisma.seccionContenido.upsert({
    where: { clave: CLAVE },
    create: { clave: CLAVE, titulo: "Nosotros", imagenUrl: subida.url },
    update: { imagenUrl: subida.url },
  });
  await registrarAuditoria({ accion: "editar", entidad: "SeccionContenido", entidadId: CLAVE, detalle: "imagen actualizada" });

  revalidatePath("/admin/contenido/nosotros");
  revalidatePath("/nosotros");
}

export async function borrarImagenNosotros(
  _prevState: EstadoNosotros,
  _formData: FormData
): Promise<EstadoNosotros> {
  await requireAdmin();
  const existente = await prisma.seccionContenido.findUnique({
    where: { clave: CLAVE },
    select: { imagenUrl: true },
  });
  if (!existente?.imagenUrl) return {};

  await borrarImagenContenido(existente.imagenUrl);
  await prisma.seccionContenido.update({
    where: { clave: CLAVE },
    data: { imagenUrl: null },
  });
  await registrarAuditoria({ accion: "editar", entidad: "SeccionContenido", entidadId: CLAVE, detalle: "imagen quitada" });

  revalidatePath("/admin/contenido/nosotros");
  revalidatePath("/nosotros");
  return {};
}
