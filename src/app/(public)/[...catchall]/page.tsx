import { notFound } from "next/navigation";

// Catch-all deliberado: no renderiza nada por sí mismo, solo dispara
// notFound() para que Next.js use el not-found.tsx de "(public)/" (con
// header/nav/footer) en vez de su 404 genérico sin marca. Ver el comentario
// completo en "(public)/not-found.tsx" sobre por qué hace falta este
// archivo. No colisiona con ninguna ruta real: Next.js siempre prioriza una
// coincidencia exacta (ej. /nosotros, /productos/[slug]) sobre este
// catch-all, que solo se activa cuando NADA más matcheó.
export default function CatchAllPublico(): never {
  notFound();
}
