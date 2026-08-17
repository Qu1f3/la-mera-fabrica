"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function limpio(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

export async function actualizarConfiguracion(formData: FormData) {
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

  // El número de WhatsApp y demás datos de contacto se usan en todo el
  // sitio público (botones de producto, footer, etc.), así que se invalida
  // todo en vez de una sola ruta.
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracion");
}
