"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { subirImagenProducto, borrarImagenProducto } from "@/lib/storage";
import type {
  Disponibilidad,
  TipoProducto,
  TipoRelacion,
} from "@/lib/types";

export type ProductoFormState = { error?: string };

function listaDesdeTexto(valor: FormDataEntryValue | null): string[] {
  return String(valor ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function numeroOpcional(valor: FormDataEntryValue | null): number | undefined {
  const texto = String(valor ?? "").trim();
  if (!texto) return undefined;
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : undefined;
}

async function generarSlugUnico(base: string, ignorarId?: string) {
  const raiz = slugify(base) || "producto";
  let slug = raiz;
  let sufijo = 1;

  while (true) {
    const existente = await prisma.producto.findFirst({
      where: { slug, ...(ignorarId ? { NOT: { id: ignorarId } } : {}) },
      select: { id: true },
    });
    if (!existente) return slug;
    sufijo += 1;
    slug = `${raiz}-${sufijo}`;
  }
}

function armarEspecificaciones(tipo: TipoProducto, formData: FormData) {
  if (tipo === "MOSAICO") {
    const spec = {
      largoCm: numeroOpcional(formData.get("largoCm")),
      anchoCm: numeroOpcional(formData.get("anchoCm")),
      espesorMm: numeroOpcional(formData.get("espesorMm")),
      coberturaCajaM2: numeroOpcional(formData.get("coberturaCajaM2")),
      piezasPorCaja: numeroOpcional(formData.get("piezasPorCaja")),
    };
    return Object.values(spec).some((v) => v !== undefined) ? spec : null;
  }

  const spec = {
    longitudPiezaCm: numeroOpcional(formData.get("longitudPiezaCm")),
    perfilMm: numeroOpcional(formData.get("perfilMm")),
    altoMm: numeroOpcional(formData.get("altoMm")),
  };
  return Object.values(spec).some((v) => v !== undefined) ? spec : null;
}

function datosBase(formData: FormData) {
  const tipo = (String(formData.get("tipo") || "MOSAICO") as TipoProducto);
  const categoriaId = String(formData.get("categoriaId") || "").trim();

  return {
    nombre: String(formData.get("nombre") || "").trim(),
    sku: String(formData.get("sku") || "").trim() || null,
    tipo,
    categoriaId: categoriaId || null,
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    estilo: String(formData.get("estilo") || "").trim() || null,
    acabado: String(formData.get("acabado") || "").trim() || null,
    colores: listaDesdeTexto(formData.get("colores")),
    aplicaciones: listaDesdeTexto(formData.get("aplicaciones")),
    disponibilidad: String(
      formData.get("disponibilidad") || "DISPONIBLE"
    ) as Disponibilidad,
    destacado: formData.get("destacado") === "on",
    activo: formData.get("activo") === "on",
    especificaciones: armarEspecificaciones(tipo, formData),
  };
}

export async function crearProducto(
  _prevState: ProductoFormState,
  formData: FormData
): Promise<ProductoFormState> {
  await requireAdmin();
  const datos = datosBase(formData);
  if (!datos.nombre) {
    return { error: "El nombre es obligatorio." };
  }

  const slugDeseado = String(formData.get("slug") || "").trim() || datos.nombre;
  const slug = await generarSlugUnico(slugDeseado);

  const producto = await prisma.producto.create({ data: { ...datos, slug } });

  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect(`/admin/productos/${producto.id}`);
}

export async function actualizarProducto(
  id: string,
  _prevState: ProductoFormState,
  formData: FormData
): Promise<ProductoFormState> {
  await requireAdmin();
  const datos = datosBase(formData);
  if (!datos.nombre) {
    return { error: "El nombre es obligatorio." };
  }

  const slugDeseado = String(formData.get("slug") || "").trim() || datos.nombre;
  const slug = await generarSlugUnico(slugDeseado, id);

  await prisma.producto.update({ where: { id }, data: { ...datos, slug } });

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/");
  revalidatePath(`/productos/${slug}`);

  return {};
}

export async function eliminarProducto(id: string, _formData: FormData) {
  await requireAdmin();
  const producto = await prisma.producto.findUnique({
    where: { id },
    select: { imagenes: { select: { url: true } } },
  });

  if (producto) {
    await Promise.all(
      producto.imagenes.map((imagen) => borrarImagenProducto(imagen.url))
    );
  }

  // Nota: si el producto ya está en alguna cotización (Fase 3), esto falla
  // por la restricción de la base de datos en vez de borrar en cascada —
  // es la protección deliberada de ItemCotizacion.producto (ver
  // prisma/schema.prisma). Hoy no puede pasar porque Fase 3 no existe
  // todavía.
  await prisma.producto.delete({ where: { id } });

  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function subirImagenesProducto(id: string, formData: FormData) {
  await requireAdmin();
  const archivos = formData
    .getAll("imagenes")
    .filter((valor): valor is File => valor instanceof File && valor.size > 0);

  if (archivos.length === 0) return;

  const conteoActual = await prisma.imagenProducto.count({
    where: { productoId: id },
  });

  let orden = conteoActual;
  for (const archivo of archivos) {
    const subida = await subirImagenProducto(id, archivo);
    await prisma.imagenProducto.create({
      data: { productoId: id, url: subida.url, orden },
    });
    orden += 1;
  }

  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/");
}

export async function actualizarOrdenImagen(
  productoId: string,
  imagenId: string,
  formData: FormData
) {
  await requireAdmin();
  const orden = Number(formData.get("orden"));
  await prisma.imagenProducto.update({
    where: { id: imagenId },
    data: { orden: Number.isFinite(orden) ? orden : 0 },
  });

  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/");
}

export async function borrarImagen(
  productoId: string,
  imagenId: string,
  _formData: FormData
) {
  await requireAdmin();
  const imagen = await prisma.imagenProducto.findUnique({
    where: { id: imagenId },
  });

  if (imagen) {
    await borrarImagenProducto(imagen.url);
    await prisma.imagenProducto.delete({ where: { id: imagenId } });
  }

  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/");
}

export async function agregarRelacionado(productoId: string, formData: FormData) {
  await requireAdmin();
  const relacionadoId = String(formData.get("relacionadoId") || "");
  const tipoRelacion = String(
    formData.get("tipoRelacion") || "SIMILAR"
  ) as TipoRelacion;

  if (!relacionadoId || relacionadoId === productoId) return;

  await prisma.productoRelacionado.upsert({
    where: {
      productoId_relacionadoId: { productoId, relacionadoId },
    },
    create: { productoId, relacionadoId, tipoRelacion },
    update: { tipoRelacion },
  });

  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/");
}

export async function quitarRelacionado(
  productoId: string,
  relacionId: string,
  _formData: FormData
) {
  await requireAdmin();
  await prisma.productoRelacionado.delete({ where: { id: relacionId } });
  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/");
}
