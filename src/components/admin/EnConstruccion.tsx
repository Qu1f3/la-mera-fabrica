/**
 * Estado para un módulo del panel que todavía no se construyó -- para que
 * el enlace del menú funcione desde ya (en vez de un 404) mientras se
 * construye ese módulo en una fase siguiente del sistema de gestión.
 */
export function EnConstruccion({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">{titulo}</h1>
      <div className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-4xl" aria-hidden="true">
          🚧
        </p>
        <p className="mt-3 text-sm font-medium text-neutral-700">
          Este módulo está en construcción
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
          {descripcion}
        </p>
      </div>
    </div>
  );
}
