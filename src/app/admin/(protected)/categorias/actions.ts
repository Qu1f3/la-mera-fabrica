"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

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

export async function crearCategoria(formData: FormData) {
  await requireAdmin();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;

  const slugDeseado = String(formData.get("slug") || "").trim() || nombre;
  const slug = await generarSlugUnico(slugDeseado);
  const orden = Number(formData.get("orden"));

  await prisma.categoria.create({
    data: { nombre, slug, orden: Number.isFinite(orden) ? orden : 0 },
  });

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function actualizarCategoria(id: string, formData: FormData) {
  await requireAdmin();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;

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

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function eliminarCategoria(id: string, _formData: FormData) {
  await requireAdmin();
  await prisma.categoria.delete({ where: { id } });
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}
