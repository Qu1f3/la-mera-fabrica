// Monto de mezcla usado como valor sugerido en el formulario cuando todavía
// no hay uno configurado en Configuracion.montoMezclaActual. Vive en su
// propio archivo (no en actions.ts) porque un archivo "use server" solo
// puede exportar funciones async -- una constante ahí rompe el build.
export const MONTO_MEZCLA_DEFAULT = 130;
