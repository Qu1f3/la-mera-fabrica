"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function crearFaq(formData: FormData) {
  await requireAdmin();
  const pregunta = String(formData.get("pregunta") || "").trim();
  const respuesta = String(formData.get("respuesta") || "").trim();
  if (!pregunta || !respuesta) return;

  const orden = Number(formData.get("orden"));

  await prisma.faq.create({
    data: { pregunta, respuesta, orden: Number.isFinite(orden) ? orden : 0 },
  });

  revalidatePath("/admin/contenido/faq");
  revalidatePath("/preguntas-frecuentes");
}

export async function actualizarFaq(id: string, formData: FormData) {
  await requireAdmin();
  const pregunta = String(formData.get("pregunta") || "").trim();
  const respuesta = String(formData.get("respuesta") || "").trim();
  if (!pregunta || !respuesta) return;

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
}

export async function eliminarFaq(id: string, _formData: FormData) {
  await requireAdmin();
  await prisma.faq.delete({ where: { id } });
  revalidatePath("/admin/contenido/faq");
  revalidatePath("/preguntas-frecuentes");
}
