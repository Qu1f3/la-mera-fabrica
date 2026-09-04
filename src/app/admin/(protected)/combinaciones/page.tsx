import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Combinaciones de mosaico — Panel administrativo" };

type ComponenteResumen = {
  id: string;
  nombre: string;
  cementoCantidad: unknown;
  cementoUnidad: string | null;
  cementoTipo: string | null;
  coloranteColor: string | null;
  coloranteCantidad: unknown;
  coloranteUnidad: string | null;
  notas: string | null;
};

// Nombres de color en español -> color real, para el puntito junto a
// "Cemento gris/blanco" y "Colorante {color}" -- ayuda a identificar de un
// vistazo sin tener que leer el texto completo. Si el nombre no está acá
// (algo escrito distinto, ej. "rojo ladrillo"), cae a un punto gris neutro
// en vez de fallar. Pedido por el usuario 2026-09-04: los registros se
// confundían fácil siendo puramente informativos.
const COLOR_HEX: Record<string, string> = {
  gris: "#9ca3af",
  blanco: "#ffffff",
  rojo: "#dc2626",
  negro: "#171717",
  azul: "#2563eb",
  verde: "#16a34a",
  amarillo: "#eab308",
  cafe: "#78350f",
  café: "#78350f",
  marron: "#78350f",
  marrón: "#78350f",
  naranja: "#ea580c",
  rosado: "#ec4899",
  rosa: "#ec4899",
  morado: "#7c3aed",
  violeta: "#7c3aed",
  celeste: "#38bdf8",
  turquesa: "#14b8a6",
  dorado: "#ca8a04",
};

function colorHex(nombre: string | null): string {
  if (!nombre) return "#d4d4d4";
  return COLOR_HEX[nombre.trim().toLowerCase()] ?? "#d4d4d4";
}

function PuntoColor({ nombre }: { nombre: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="mr-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border border-black/10 align-[-1px]"
      style={{ backgroundColor: colorHex(nombre) }}
    />
  );
}

// Paleta de respaldo para el avatar de un mosaico sin foto -- un color fijo
// por producto (elegido a partir de su id, siempre el mismo) para poder
// distinguir unos de otros aunque no tengan imagen todavía.
const PALETA_AVATAR = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function colorAvatar(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETA_AVATAR[hash % PALETA_AVATAR.length];
}

/**
 * Una fila por componente (capa) de la combinación, con el cemento y el
 * colorante como etiquetas -- antes era una sola línea de texto plano tipo
 * "Fondo Rojo (cemento gris 42.5kg + colorante rojo 6lb); Pringa Negra
 * (...)" que se leía como un volcado de datos crudo; el usuario pidió que
 * se viera más cuidado (2026-09-03).
 */
function FilaComponente({ componente }: { componente: ComponenteResumen }) {
  const hayCemento = componente.cementoCantidad !== null && componente.cementoCantidad !== undefined;
  const hayColorante = Boolean(componente.coloranteColor);
  const tipoCemento = componente.cementoTipo === "blanco" ? "blanco" : "gris";

  return (
    <div className="rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2">
      <p className="text-sm font-medium text-neutral-800">{componente.nombre}</p>
      {(hayCemento || hayColorante) && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {hayCemento && (
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
              <PuntoColor nombre={tipoCemento} />
              Cemento {tipoCemento} · {String(componente.cementoCantidad)} {componente.cementoUnidad}
            </span>
          )}
          {hayColorante && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              <PuntoColor nombre={componente.coloranteColor} />
              Colorante {componente.coloranteColor}
              {componente.coloranteCantidad !== null && componente.coloranteCantidad !== undefined
                ? ` · ${String(componente.coloranteCantidad)} ${componente.coloranteUnidad}`
                : " (cantidad variable)"}
            </span>
          )}
        </div>
      )}
      {componente.notas && <p className="mt-1.5 text-xs text-neutral-400">{componente.notas}</p>}
    </div>
  );
}

/**
 * Catálogo de referencia "cuánto cemento + colorante lleva cada mosaico" --
 * pedido por el usuario 2026-09-03. Es solo informativo: no descuenta
 * inventario ni se conecta con Producción, a propósito (ver actions.ts).
 * Visible y editable tanto para ADMIN como EMPLEADO -- decisión explícita
 * del usuario, igual que Producción/Inventario.
 *
 * Rediseño 2026-09-04: el usuario reportó que los registros se confundían
 * fácil entre sí a simple vista. Se agregó la foto del mosaico (o un avatar
 * con inicial y color fijo si todavía no tiene foto) junto al nombre, y un
 * puntito de color junto a cada cemento/colorante para reconocer de un
 * vistazo sin tener que leer el texto completo.
 */
export default async function CombinacionesPage() {
  const combinaciones = await prisma.combinacionMosaico.findMany({
    include: {
      producto: {
        select: {
          nombre: true,
          sku: true,
          imagenes: { select: { url: true }, orderBy: { orden: "asc" }, take: 1 },
        },
      },
      componentes: { orderBy: { orden: "asc" } },
    },
    orderBy: { producto: { nombre: "asc" } },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Combinaciones de mosaico</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Cuánto cemento y colorante lleva cada mosaico -- solo de referencia, no afecta el
            inventario.
          </p>
        </div>
        <Link
          href="/admin/combinaciones/nueva"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Nueva combinación
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {combinaciones.map((combinacion) => {
          const imagen = combinacion.producto.imagenes[0];
          return (
            <Link
              key={combinacion.id}
              href={`/admin/combinaciones/${combinacion.id}`}
              className="flex gap-3 rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-sm"
            >
              {imagen ? (
                // Miniatura chica en una lista -- mismo criterio que Combobox.tsx
                // (imagen ya optimizada en origen, next/image no aporta nada acá).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagen.url}
                  alt=""
                  loading="lazy"
                  className="h-14 w-14 flex-shrink-0 rounded-md border border-neutral-200 object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md text-lg font-semibold ${colorAvatar(combinacion.productoId)}`}
                >
                  {combinacion.producto.nombre.trim().slice(0, 1).toUpperCase() || "?"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">
                  {combinacion.producto.nombre}
                  {combinacion.producto.sku && (
                    <span className="ml-1.5 text-xs font-normal text-neutral-400">
                      ({combinacion.producto.sku})
                    </span>
                  )}
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {combinacion.componentes.map((componente) => (
                    <FilaComponente key={componente.id} componente={componente} />
                  ))}
                </div>
                {combinacion.notas && (
                  <p className="mt-2 text-xs text-neutral-400">{combinacion.notas}</p>
                )}
              </div>
            </Link>
          );
        })}
        {combinaciones.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            Todavía no hay combinaciones registradas.
          </p>
        )}
      </div>
    </div>
  );
}
