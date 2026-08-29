"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

function calificacionOpcional(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const numero = Number(texto);
  if (!Number.isFinite(numero)) return null;
  return Math.min(5, Math.max(1, Math.round(numero)));
}

export async function crearTestimonio(formData: FormData) {
  await requireAdmin();
  const nombreCliente = String(formData.get("nombreCliente") || "").trim();
  const texto = String(formData.get("texto") || "").trim();
  if (!nombreCliente || !texto) return;

  await prisma.testimonio.create({
    data: {
      nombreCliente,
      texto,
      calificacion: calificacionOpcional(formData.get("calificacion")),
      fotoUrl: String(formData.get("fotoUrl") || "").trim() || null,
    },
  });

  revalidatePath("/admin/contenido/testimonios");
  revalidatePath("/");
}

export async function actualizarTestimonio(id: string, formData: FormData) {
  await requireAdmin();
  const nombreCliente = String(formData.get("nombreCliente") || "").trim();
  const texto = String(formData.get("texto") || "").trim();
  if (!nombreCliente || !texto) return;

  await prisma.testimonio.update({
    where: { id },
    data: {
      nombreCliente,
      texto,
      calificacion: calificacionOpcional(formData.get("calificacion")),
      fotoUrl: String(formData.get("fotoUrl") || "").trim() || null,
      activo: formData.get("activo") === "on",
    },
  });

  revalidatePath("/admin/contenido/testimonios");
  revalidatePath("/");
}

export async function eliminarTestimonio(id: string, _formData: FormData) {
  await requireAdmin();
  const testimonio = await prisma.testimonio.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Testimonio", entidadId: id, detalle: testimonio.nombreCliente });
  revalidatePath("/admin/contenido/testimonios");
  revalidatePath("/");
}
