"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { subirImagenContenido, borrarImagenContenido } from "@/lib/storage";

function limpio(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

function fecha(valor: FormDataEntryValue | null): Date | null {
  const texto = String(valor ?? "").trim();
  return texto ? new Date(texto) : null;
}

function datosBase(formData: FormData) {
  const titulo = String(formData.get("titulo") || "").trim();
  const orden = Number(formData.get("orden"));

  return {
    titulo,
    subtitulo: limpio(formData.get("subtitulo")),
    enlace: limpio(formData.get("enlace")),
    orden: Number.isFinite(orden) ? orden : 0,
    activo: formData.get("activo") === "on",
    fechaInicio: fecha(formData.get("fechaInicio")),
    fechaFin: fecha(formData.get("fechaFin")),
  };
}

export async function crearBanner(formData: FormData) {
  await requireAdmin();
  const datos = datosBase(formData);
  if (!datos.titulo) return;

  const banner = await prisma.banner.create({ data: datos });

  revalidatePath("/admin/contenido/banners");
  revalidatePath("/");
  redirect(`/admin/contenido/banners/${banner.id}`);
}

export async function actualizarBanner(id: string, formData: FormData) {
  await requireAdmin();
  const datos = datosBase(formData);
  if (!datos.titulo) return;

  await prisma.banner.update({ where: { id }, data: datos });

  revalidatePath("/admin/contenido/banners");
  revalidatePath(`/admin/contenido/banners/${id}`);
  revalidatePath("/");
}

export async function subirImagenBanner(id: string, formData: FormData) {
  await requireAdmin();
  const archivo = formData.get("imagen");
  if (!(archivo instanceof File) || archivo.size === 0) return;

  const banner = await prisma.banner.findUnique({
    where: { id },
    select: { imagenUrl: true },
  });
  if (!banner) return;

  if (banner.imagenUrl) {
    await borrarImagenContenido(banner.imagenUrl);
  }

  const subida = await subirImagenContenido("banners", archivo);
  await prisma.banner.update({
    where: { id },
    data: { imagenUrl: subida.url },
  });

  revalidatePath(`/admin/contenido/banners/${id}`);
  revalidatePath("/");
}

export async function borrarImagenBanner(id: string, _formData: FormData) {
  await requireAdmin();
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: { imagenUrl: true },
  });
  if (!banner?.imagenUrl) return;

  await borrarImagenContenido(banner.imagenUrl);
  await prisma.banner.update({ where: { id }, data: { imagenUrl: null } });

  revalidatePath(`/admin/contenido/banners/${id}`);
  revalidatePath("/");
}

export async function eliminarBanner(id: string, _formData: FormData) {
  await requireAdmin();
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: { imagenUrl: true },
  });

  if (banner?.imagenUrl) {
    await borrarImagenContenido(banner.imagenUrl);
  }

  await prisma.banner.delete({ where: { id } });

  revalidatePath("/admin/contenido/banners");
  revalidatePath("/");
  redirect("/admin/contenido/banners");
}
