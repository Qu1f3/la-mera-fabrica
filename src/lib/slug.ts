/**
 * Genera un slug a partir de un texto (nombre de producto o categoria).
 * Ej: "Mosaico Rustico 60x60" -> "mosaico-rustico-60x60"
 */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
