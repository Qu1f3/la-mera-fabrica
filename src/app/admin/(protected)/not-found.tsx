import Link from "next/link";

// Se muestra cuando `notFound()` se dispara dentro del panel (un pedido,
// cliente, material, empleado, etc. cuyo id ya no existe -- por ejemplo un
// enlace viejo guardado, o un registro que alguien más borró mientras tanto).
// Al vivir dentro de "(protected)" se renderiza DENTRO del layout del panel
// (sidebar/nav visibles), en vez del 404 genérico de Next.js fuera de toda
// la interfaz administrativa.
export default function NoEncontradoAdmin() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-neutral-200 bg-white p-6">
      <p className="text-sm font-semibold text-neutral-900">
        No encontramos lo que buscabas
      </p>
      <p className="text-sm text-neutral-500">
        Puede que el enlace esté viejo, o que este registro ya se haya
        borrado.
      </p>
      <Link
        href="/admin"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
