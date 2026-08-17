// Esqueleto de carga para la ficha de producto.
export default function CargandoProducto() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
      <div className="h-4 w-40 rounded bg-neutral-100" />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="aspect-square w-full rounded-lg bg-neutral-100" />

        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-neutral-100" />
          <div className="h-7 w-2/3 rounded bg-neutral-200" />
          <div className="h-5 w-28 rounded bg-neutral-100" />
          <div className="mt-4 h-4 w-full rounded bg-neutral-100" />
          <div className="h-4 w-5/6 rounded bg-neutral-100" />
          <div className="mt-6 h-10 w-48 rounded bg-neutral-200" />
        </div>
      </div>
    </main>
  );
}
