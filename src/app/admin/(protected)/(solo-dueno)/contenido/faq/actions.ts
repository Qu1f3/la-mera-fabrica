"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type EstadoFaq = { error?: string };

export async function crearFaq(
  _prevState: EstadoFaq,
  formData: FormData
): Promise<EstadoFaq> {
  await requireAdmin();
  const pregunta = String(formData.get("pregunta") || "").trim();
  const respuesta = String(formData.get("respuesta") || "").trim();
  if (!pregunta || !respuesta) {
    return { error: "La pregunta y la respuesta son obligatorias." };
  }

  const orden = Number(formData.get("orden"));

  await prisma.faq.create({
    data: { pregunta, respuesta, orden: Number.isFinite(orden) ? orden : 0 },
  });

  revalidatePath("/admin/contenido/faq");
  revalidatePath("/preguntas-frecuentes");
  return {};
}

export async function actualizarFaq(
  id: string,
  _prevState: EstadoFaq,
  formData: FormData
): Promise<EstadoFaq> {
  await requireAdmin();
  const pregunta = String(formData.get("pregunta") || "").trim();
  const respuesta = String(formData.get("respuesta") || "").trim();
  if (!pregunta || !respuesta) {
    return { error: "La pregunta y la respuesta son obligatorias." };
  }

  const orden = Number(formData.get("orden"));

  await prisma.faq.update({
    where: { id },
    data: {
      pregunta,
      respuesta,
      orden: Number.isFinite(orden) ? orden : 0,
      activo: formData.get("activo") === "on",
    },
  });

  revalidatePath("/admin/contenido/faq");
  revalidatePath("/preguntas-frecuentes");
  return {};
}

export async function eliminarFaq(
  id: string,
  _prevState: EstadoFaq,
  _formData: FormData
): Promise<EstadoFaq> {
  await requireAdmin();
  const faq = await prisma.faq.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Faq", entidadId: id, detalle: faq.pregunta });
  revalidatePath("/admin/contenido/faq");
  revalidatePath("/preguntas-frecuentes");
  return {};
}
