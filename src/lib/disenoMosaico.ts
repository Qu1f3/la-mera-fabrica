/**
 * Regla de negocio real del catálogo (confirmada por el usuario, no
 * inventada): "Acera" y "Liso" son las únicas categorías de mosaico — todo
 * lo demás (Maya, Granito, Espiral, Estrella, Palmera) es el DISEÑO
 * (el patrón/dibujo) de esa categoría, no una categoría en sí misma.
 *
 * Reutiliza la columna `estilo` de `Producto` (ver ProductoForm.tsx) — antes
 * era texto libre ("Rústico", "Moderno"); para mosaico ahora es este
 * vocabulario fijo. Para moldura sigue siendo texto libre, sin cambios.
 *
 * Restricción real: un mosaico "Liso" puede tener cualquiera de los 5
 * diseños. Un mosaico "Acera" puede tener cualquiera EXCEPTO "Espiral" — no
 * existe una Acera con diseño Espiral.
 */
export const DISENOS_MOSAICO = [
  "Maya",
  "Granito",
  "Espiral",
  "Estrella",
  "Palmera",
] as const;

export type DisenoMosaico = (typeof DISENOS_MOSAICO)[number];

const CATEGORIA_SIN_ESPIRAL = "acera";

/**
 * Diseños válidos para una categoría dada. `nombreCategoria` es el nombre
 * tal como está guardado en la tabla `Categoria` (ver /admin/categorias) —
 * se compara sin distinguir mayúsculas/acentos exactos por seguridad, pero
 * depende de que la categoría se llame literalmente "Acera" o "Liso" ahí.
 * Si no hay categoría seleccionada (o es una categoría distinta), se
 * permiten los 5 diseños sin restricción.
 */
export function disenosPermitidos(
  nombreCategoria: string | null | undefined
): readonly DisenoMosaico[] {
  if (nombreCategoria?.trim().toLowerCase() === CATEGORIA_SIN_ESPIRAL) {
    return DISENOS_MOSAICO.filter((d) => d !== "Espiral");
  }
  return DISENOS_MOSAICO;
}
