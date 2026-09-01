"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { subirImagenContenido, borrarImagenContenido } from "@/lib/storage";
import { registrarAuditoria } from "@/lib/auditoria";

export type EstadoBanner = { error?: string };

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

export async function crearBanner(
  _prevState: EstadoBanner,
  formData: FormData
): Promise<EstadoBanner> {
  await requireAdmin();
  const datos = datosBase(formData);
  if (!datos.titulo) return { error: "El título es obligatorio." };

  const banner = await prisma.banner.create({ data: datos });

  revalidatePath("/admin/contenido/banners");
  revalidatePath("/");
  redirect(`/admin/contenido/banners/${banner.id}`);
}

export async function actualizarBanner(
  id: string,
  _prevState: EstadoBanner,
  formData: FormData
): Promise<EstadoBanner> {
  await requireAdmin();
  const datos = datosBase(formData);
  if (!datos.titulo) return { error: "El título es obligatorio." };

  await prisma.banner.update({ where: { id }, data: datos });

  revalidatePath("/admin/contenido/banners");
  revalidatePath(`/admin/contenido/banners/${id}`);
  revalidatePath("/");
  return {};
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

export async function borrarImagenBanner(
  id: string,
  _prevState: EstadoBanner,
  _formData: FormData
): Promise<EstadoBanner> {
  await requireAdmin();
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: { imagenUrl: true },
  });
  if (!banner?.imagenUrl) return {};

  await borrarImagenContenido(banner.imagenUrl);
  await prisma.banner.update({ where: { id }, data: { imagenUrl: null } });

  revalidatePath(`/admin/contenido/banners/${id}`);
  revalidatePath("/");
  return {};
}

export async function eliminarBanner(
  id: string,
  _prevState: EstadoBanner,
  _formData: FormData
): Promise<EstadoBanner> {
  await requireAdmin();
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: { imagenUrl: true },
  });

  if (banner?.imagenUrl) {
    await borrarImagenContenido(banner.imagenUrl);
  }

  const eliminado = await prisma.banner.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Banner", entidadId: id, detalle: eliminado.titulo });

  revalidatePath("/admin/contenido/banners");
  revalidatePath("/");
  redirect("/admin/contenido/banners");
}
