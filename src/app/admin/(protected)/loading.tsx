// Esqueleto de carga genérico para todo el panel administrativo -- Next.js
// lo muestra automáticamente (dentro del layout, con el sidebar/nav ya
// visible) mientras se resuelven las consultas async de cualquier page.tsx
// bajo /admin, en vez de dejar el área de contenido en blanco. Es genérico
// a propósito (no una por cada página): las páginas varían mucho entre sí
// (tablas, tarjetas, formularios) pero todas comparten este mismo patrón de
// encabezado + bloques, igual que loading.tsx del sitio público.
export default function CargandoAdmin() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-72 max-w-full rounded bg-neutral-100" />

      <div className="mt-6 space-y-3">
        <div className="h-24 rounded-lg border border-neutral-200 bg-neutral-100" />
        <div className="h-24 rounded-lg border border-neutral-200 bg-neutral-100" />
        <div className="h-24 rounded-lg border border-neutral-200 bg-neutral-100" />
      </div>
    </div>
  );
}
