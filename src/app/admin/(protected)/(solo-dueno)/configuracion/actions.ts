"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type EstadoConfiguracion = { error?: string };

function limpio(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

export async function actualizarConfiguracion(
  _prevState: EstadoConfiguracion,
  formData: FormData
): Promise<EstadoConfiguracion> {
  await requireAdmin();
  await prisma.configuracion.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      whatsappNumero: limpio(formData.get("whatsappNumero")),
      horarioAtencion: limpio(formData.get("horarioAtencion")),
      direccion: limpio(formData.get("direccion")),
      mapaUrl: limpio(formData.get("mapaUrl")),
      facebookUrl: limpio(formData.get("facebookUrl")),
      instagramUrl: limpio(formData.get("instagramUrl")),
    },
    update: {
      whatsappNumero: limpio(formData.get("whatsappNumero")),
      horarioAtencion: limpio(formData.get("horarioAtencion")),
      direccion: limpio(formData.get("direccion")),
      mapaUrl: limpio(formData.get("mapaUrl")),
      facebookUrl: limpio(formData.get("facebookUrl")),
      instagramUrl: limpio(formData.get("instagramUrl")),
    },
  });

  await registrarAuditoria({ accion: "editar", entidad: "Configuracion", entidadId: "global" });

  // El número de WhatsApp y demás datos de contacto se usan en todo el
  // sitio público (botones de producto, footer, etc.), así que se invalida
  // todo en vez de una sola ruta.
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracion");
  return {};
}

/**
 * Fase 9: guarda el texto de una plantilla de WhatsApp (Configuracion no
 * necesita crearlas -- ver configuracion/page.tsx, que las crea con el
 * texto por defecto de src/lib/whatsapp.ts la primera vez que hacen falta).
 * Solo se edita el cuerpo del mensaje, nunca la clave que la identifica.
 */
export async function actualizarPlantilla(
  clave: string,
  _prevState: EstadoConfiguracion,
  formData: FormData
): Promise<EstadoConfiguracion> {
  await requireAdmin();
  const cuerpo = String(formData.get("cuerpo") || "").trim();
  if (!cuerpo) return { error: "El mensaje no puede quedar vacío." };

  await prisma.plantillaMensaje.update({ where: { clave }, data: { cuerpo } });
  await registrarAuditoria({ accion: "editar", entidad: "PlantillaMensaje", entidadId: clave });

  revalidatePath("/admin/configuracion");
  // "layout" porque el mensaje se usa en /admin/pedidos/[id], una ruta
  // dinámica -- revalidar solo "/admin/pedidos" no alcanzaría los detalles.
  revalidatePath("/admin/pedidos", "layout");
  return {};
}
