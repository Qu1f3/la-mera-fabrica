/**
 * Redimensiona/comprime una imagen en el navegador antes de subirla.
 *
 * Motivo (ver también src/components/admin/SubirFotosProducto.tsx): Vercel
 * rechaza cualquier request a un Server Action con más de 4.5MB de cuerpo —
 * límite fijo de la plataforma, no configurable desde Next.js. Cuando eso
 * pasa, el navegador ni siquiera llega a mostrar un error de la app: corta
 * la conexión y muestra su propia pantalla genérica de error. Una foto de
 * celular a resolución completa fácilmente pesa más que eso, así que se
 * reduce ANTES de enviarla — así entra sin problema tanto en ese límite como
 * en el límite de 5MB del bucket de Supabase (ver src/lib/storage.ts).
 *
 * Solo debe importarse desde componentes de cliente ("use client") — usa
 * APIs de navegador (canvas, createImageBitmap).
 */
const LADO_MAXIMO_PX = 1600;
const CALIDAD_JPEG = 0.82;

export async function comprimirImagen(archivo: File): Promise<File> {
  if (!archivo.type.startsWith("image/")) return archivo;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(archivo);
  } catch {
    // Si el navegador no puede decodificarla acá, se manda tal cual — que
    // sea el servidor el que la rechace con un mensaje claro si hace falta.
    return archivo;
  }

  const escala = Math.min(
    1,
    LADO_MAXIMO_PX / Math.max(bitmap.width, bitmap.height)
  );
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const contexto = canvas.getContext("2d");
  if (!contexto) return archivo;
  contexto.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG)
  );
  if (!blob || blob.size >= archivo.size) return archivo;

  const nombreBase = archivo.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${nombreBase}.jpg`, { type: "image/jpeg" });
}
