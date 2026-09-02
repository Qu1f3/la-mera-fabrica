"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { registrarAuditoria } from "@/lib/auditoria";

export type EstadoCategoria = { error?: string };

async function generarSlugUnico(base: string, ignorarId?: string) {
  const raiz = slugify(base) || "categoria";
  let slug = raiz;
  let sufijo = 1;

  while (true) {
    const existente = await prisma.categoria.findFirst({
      where: { slug, ...(ignorarId ? { NOT: { id: ignorarId } } : {}) },
      select: { id: true },
    });
    if (!existente) return slug;
    sufijo += 1;
    slug = `${raiz}-${sufijo}`;
  }
}

export async function crearCategoria(
  _prevState: EstadoCategoria,
  formData: FormData
): Promise<EstadoCategoria> {
  await requireAdmin();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const slugDeseado = String(formData.get("slug") || "").trim() || nombre;
  const slug = await generarSlugUnico(slugDeseado);
  const orden = Number(formData.get("orden"));

  const categoria = await prisma.categoria.create({
    data: { nombre, slug, orden: Number.isFinite(orden) ? orden : 0 },
  });
  await registrarAuditoria({ accion: "crear", entidad: "Categoria", entidadId: categoria.id, detalle: categoria.nombre });

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return {};
}

export async function actualizarCategoria(
  id: string,
  _prevState: EstadoCategoria,
  formData: FormData
): Promise<EstadoCategoria> {
  await requireAdmin();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const slugDeseado = String(formData.get("slug") || "").trim() || nombre;
  const slug = await generarSlugUnico(slugDeseado, id);
  const orden = Number(formData.get("orden"));

  await prisma.categoria.update({
    where: { id },
    data: {
      nombre,
      slug,
      orden: Number.isFinite(orden) ? orden : 0,
      activo: formData.get("activo") === "on",
    },
  });
  await registrarAuditoria({ accion: "editar", entidad: "Categoria", entidadId: id, detalle: nombre });

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return {};
}

export async function eliminarCategoria(
  id: string,
  _prevState: EstadoCategoria,
  _formData: FormData
): Promise<EstadoCategoria> {
  await requireAdmin();
  const categoria = await prisma.categoria.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Categoria", entidadId: id, detalle: categoria.nombre });
  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return {};
}
