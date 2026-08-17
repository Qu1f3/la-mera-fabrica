// Esqueleto de carga para la página principal (catálogo) — Next.js lo
// muestra automáticamente mientras se resuelven las consultas async de
// page.tsx, en vez de dejar la pantalla en blanco.
export default function CargandoInicio() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
      <div className="h-7 w-72 rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-96 max-w-full rounded bg-neutral-100" />

      <div className="mt-6 h-16 rounded-lg border border-neutral-200 bg-neutral-100" />

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, indice) => (
          <div
            key={indice}
            className="overflow-hidden rounded-lg border border-neutral-200"
          >
            <div className="aspect-square w-full bg-neutral-100" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/2 rounded bg-neutral-100" />
              <div className="h-4 w-3/4 rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
