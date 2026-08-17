import { redirect } from "next/navigation";

// El catálogo se movió a la página principal ("/") a pedido del usuario —
// esta ruta se conserva solo para no romper enlaces o marcadores viejos a
// "/productos" (con o sin filtros), redirigiendo al mismo lugar con los
// mismos parámetros de búsqueda.
export default async function CatalogoRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  for (const [clave, valor] of Object.entries(sp)) {
    if (Array.isArray(valor)) {
      valor.forEach((v) => params.append(clave, v));
    } else if (valor !== undefined) {
      params.append(clave, valor);
    }
  }

  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
