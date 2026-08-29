"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { EstadoCotizacion } from "@/lib/types";
import { registrarAuditoria } from "@/lib/auditoria";

export async function actualizarEstadoCotizacion(
  id: string,
  formData: FormData
) {
  await requireAdmin();
  const estado = String(formData.get("estado") || "NUEVA") as EstadoCotizacion;

  await prisma.solicitudCotizacion.update({
    where: { id },
    data: { estado },
  });

  revalidatePath("/admin/cotizaciones");
  revalidatePath(`/admin/cotizaciones/${id}`);
}

export async function eliminarCotizacion(id: string, _formData: FormData) {
  await requireAdmin();
  const cotizacion = await prisma.solicitudCotizacion.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "SolicitudCotizacion", entidadId: id, detalle: cotizacion.nombreCliente });
  revalidatePath("/admin/cotizaciones");
  redirect("/admin/cotizaciones");
}
