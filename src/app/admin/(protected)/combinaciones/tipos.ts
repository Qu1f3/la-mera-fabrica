/**
 * Tipos compartidos entre los formularios de combinaciones (Nueva/Editar) y
 * las Server Actions -- ver actions.ts. La lista de componentes viaja del
 * cliente al servidor como JSON dentro de un campo oculto del formulario
 * (ComponentesEditor.tsx) porque un <form> nativo no tiene una forma limpia
 * de mandar un array de objetos con nombres de campo únicos por fila (mismo
 * problema, otra solución, que las líneas de producto de
 * produccion/nuevo/NuevoRegistroProduccionForm.tsx).
 */
export type ComponenteFormulario = {
  /** Solo para el key de React -- no se manda tal cual al servidor. */
  key: string;
  nombre: string;
  cementoCantidad: string;
  cementoUnidad: string;
  coloranteColor: string;
  coloranteCantidad: string;
  coloranteUnidad: string;
  notas: string;
};

export const UNIDADES_PESO = ["kg", "lb"] as const;

export function componenteVacio(key: string): ComponenteFormulario {
  return {
    key,
    nombre: "",
    cementoCantidad: "",
    cementoUnidad: "kg",
    coloranteColor: "",
    coloranteCantidad: "",
    coloranteUnidad: "lb",
    notas: "",
  };
}
