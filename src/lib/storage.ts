import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_PRODUCTOS = "productos";
const BUCKET_CONTENIDO = "contenido";

/**
 * Crea un bucket de imágenes público si todavía no existe. Se llama antes de
 * cada subida en vez de depender de un paso manual de setup en el dashboard
 * de Supabase — así el proyecto funciona con solo llenar el .env.
 */
async function ensureBucket(bucket: string) {
  const supabase = createAdminClient();
  const { data: existente } = await supabase.storage.getBucket(bucket);

  if (!existente) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: "5MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    // Si dos requests intentan crear el bucket a la vez, el segundo puede
    // fallar porque el primero ya lo creó — no es un error real.
    if (error && !error.message?.toLowerCase().includes("already exists")) {
      throw new Error(`No se pudo crear el bucket de imágenes: ${error.message}`);
    }
  }
}

export type ImagenSubida = {
  url: string;
  path: string;
};

function extraerPathDeUrl(url: string, bucket: string): string | null {
  const marcador = `/storage/v1/object/public/${bucket}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  return url.slice(indice + marcador.length);
}

async function subirImagen(
  bucket: string,
  carpeta: string,
  archivo: File
): Promise<ImagenSubida> {
  await ensureBucket(bucket);

  const supabase = createAdminClient();
  const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${carpeta}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, archivo, {
    contentType: archivo.type || "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

async function borrarImagen(bucket: string, url: string): Promise<void> {
  const path = extraerPathDeUrl(url, bucket);
  if (!path) return;

  const supabase = createAdminClient();
  await supabase.storage.from(bucket).remove([path]);
}

/**
 * Sube una imagen de producto y devuelve su URL pública. `productoId` se usa
 * como prefijo de carpeta para mantener las imágenes organizadas por
 * producto en el bucket.
 */
export function subirImagenProducto(productoId: string, archivo: File) {
  return subirImagen(BUCKET_PRODUCTOS, productoId, archivo);
}

/** Borra una imagen de producto del bucket a partir de su URL pública. */
export function borrarImagenProducto(url: string) {
  return borrarImagen(BUCKET_PRODUCTOS, url);
}

/**
 * Sube una imagen de contenido del sitio (banner, sección "Nosotros") a un
 * bucket separado del de productos, organizada por `carpeta` (ej: "banners",
 * "nosotros") — ver Fase 4.
 */
export function subirImagenContenido(carpeta: string, archivo: File) {
  return subirImagen(BUCKET_CONTENIDO, carpeta, archivo);
}

/** Borra una imagen de contenido del bucket a partir de su URL pública. */
export function borrarImagenContenido(url: string) {
  return borrarImagen(BUCKET_CONTENIDO, url);
}
