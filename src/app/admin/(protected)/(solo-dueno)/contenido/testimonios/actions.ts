"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type EstadoTestimonio = { error?: string };

function calificacionOpcional(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const numero = Number(texto);
  if (!Number.isFinite(numero)) return null;
  return Math.min(5, Math.max(1, Math.round(numero)));
}

export async function crearTestimonio(
  _prevState: EstadoTestimonio,
  formData: FormData
): Promise<EstadoTestimonio> {
  await requireAdmin();
  const nombreCliente = String(formData.get("nombreCliente") || "").trim();
  const texto = String(formData.get("texto") || "").trim();
  if (!nombreCliente || !texto) {
    return { error: "El nombre del cliente y el testimonio son obligatorios." };
  }

  const testimonio = await prisma.testimonio.create({
    data: {
      nombreCliente,
      texto,
      calificacion: calificacionOpcional(formData.get("calificacion")),
      fotoUrl: String(formData.get("fotoUrl") || "").trim() || null,
    },
  });
  await registrarAuditoria({ accion: "crear", entidad: "Testimonio", entidadId: testimonio.id, detalle: testimonio.nombreCliente });

  revalidatePath("/admin/contenido/testimonios");
  revalidatePath("/");
  return {};
}

export async function actualizarTestimonio(
  id: string,
  _prevState: EstadoTestimonio,
  formData: FormData
): Promise<EstadoTestimonio> {
  await requireAdmin();
  const nombreCliente = String(formData.get("nombreCliente") || "").trim();
  const texto = String(formData.get("texto") || "").trim();
  if (!nombreCliente || !texto) {
    return { error: "El nombre del cliente y el testimonio son obligatorios." };
  }

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
  await registrarAuditoria({ accion: "editar", entidad: "Testimonio", entidadId: id, detalle: nombreCliente });

  revalidatePath("/admin/contenido/testimonios");
  revalidatePath("/");
  return {};
}

export async function eliminarTestimonio(
  id: string,
  _prevState: EstadoTestimonio,
  _formData: FormData
): Promise<EstadoTestimonio> {
  await requireAdmin();
  const testimonio = await prisma.testimonio.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Testimonio", entidadId: id, detalle: testimonio.nombreCliente });
  revalidatePath("/admin/contenido/testimonios");
  revalidatePath("/");
  return {};
}
