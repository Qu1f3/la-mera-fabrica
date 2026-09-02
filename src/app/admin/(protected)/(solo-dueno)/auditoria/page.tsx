import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatearFechaHoraHonduras, fechaDesdeInputHonduras } from "@/lib/fecha";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Auditoría — Panel administrativo" };

// Etiquetas amigables para los valores de "entidad" que se guardan en
// RegistroAuditoria (ver src/lib/auditoria.ts) -- si aparece una entidad
// nueva que no está en este mapa, se muestra el nombre técnico tal cual en
// vez de romper la página.
const ETIQUETA_ENTIDAD: Record<string, string> = {
  Categoria: "Categoría",
  Cliente: "Cliente",
  Configuracion: "Configuración del sitio",
  PlantillaMensaje: "Plantilla de WhatsApp",
  Banner: "Banner",
  Faq: "Pregunta frecuente",
  SeccionContenido: "Contenido del sitio",
  Testimonio: "Testimonio",
  SolicitudCotizacion: "Cotización",
  Empleado: "Empleado",
  Producto: "Producto",
  TipoPagoExtra: "Tipo de pago extra",
  PagoExtraEmpleado: "Pago extra",
  MaterialInventario: "Material de inventario",
  MovimientoInventario: "Movimiento de inventario",
  Compra: "Compra",
  Proveedor: "Proveedor",
  PagoEmpleado: "Pago semanal",
  Pedido: "Pedido",
  RegistroRiego: "Riego",
  Entrega: "Entrega",
  RegistroProduccion: "Producción",
  RegistroMezcla: "Mezcla",
  PagoUnitarioProducto: "Pago por unidad",
};

// Mismo criterio para "accion" -- ver los distintos valores que
// registrarAuditoria recibe en cada actions.ts del panel.
const ETIQUETA_ACCION: Record<string, string> = {
  crear: "Creó",
  editar: "Editó",
  eliminar: "Eliminó",
  activar: "Activó",
  desactivar: "Desactivó",
  cambiar_estado: "Cambió estado",
  marcar_pagada: "Marcó pagada",
  marcar_pagado: "Marcó pagado",
  marcar_pendiente: "Marcó pendiente",
  generar: "Generó",
};

const COLOR_ACCION: Record<string, string> = {
  crear: "border-emerald-200 bg-emerald-50 text-emerald-700",
  editar: "border-sky-200 bg-sky-50 text-sky-700",
  eliminar: "border-red-200 bg-red-50 text-red-700",
  activar: "border-emerald-200 bg-emerald-50 text-emerald-700",
  desactivar: "border-neutral-300 bg-neutral-100 text-neutral-600",
  cambiar_estado: "border-amber-200 bg-amber-50 text-amber-700",
  marcar_pagada: "border-amber-200 bg-amber-50 text-amber-700",
  marcar_pagado: "border-amber-200 bg-amber-50 text-amber-700",
  marcar_pendiente: "border-neutral-300 bg-neutral-100 text-neutral-600",
  generar: "border-sky-200 bg-sky-50 text-sky-700",
};

const LIMITE_REGISTROS = 300;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    usuario?: string;
    entidad?: string;
    accion?: string;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const { usuario, entidad, accion, desde, hasta } = await searchParams;

  const usuarioFiltro = (usuario || "").trim();
  const entidadFiltro = (entidad || "").trim();
  const accionFiltro = (accion || "").trim();

  // Los inputs de fecha son "YYYY-MM-DD" en hora de Honduras -- se arman con
  // el mismo helper que usan las server actions (ver src/lib/fecha.ts) para
  // no repetir el bug de zona horaria que se corrigió en pedidos/pagos.
  const desdeFecha = fechaDesdeInputHonduras(desde);
  const hastaFecha = fechaDesdeInputHonduras(hasta);
  // "hasta" es el día completo indicado, así que el límite superior es la
  // medianoche Honduras del día SIGUIENTE (exclusivo).
  const hastaExclusivo = hastaFecha
    ? new Date(hastaFecha.getTime() + 24 * 60 * 60 * 1000)
    : null;

  const where: Prisma.RegistroAuditoriaWhereInput = {
    ...(usuarioFiltro ? { usuarioEmail: usuarioFiltro } : {}),
    ...(entidadFiltro ? { entidad: entidadFiltro } : {}),
    ...(accionFiltro ? { accion: accionFiltro } : {}),
    ...(desdeFecha || hastaExclusivo
      ? {
          creadoEn: {
            ...(desdeFecha ? { gte: desdeFecha } : {}),
            ...(hastaExclusivo ? { lt: hastaExclusivo } : {}),
          },
        }
      : {}),
  };

  const hayFiltros = Boolean(
    usuarioFiltro || entidadFiltro || accionFiltro || desde || hasta
  );

  const [registros, total, usuariosDisponibles, entidadesDisponibles, accionesDisponibles] =
    await Promise.all([
      prisma.registroAuditoria.findMany({
        where,
        orderBy: { creadoEn: "desc" },
        take: LIMITE_REGISTROS,
      }),
      prisma.registroAuditoria.count({ where }),
      prisma.registroAuditoria.findMany({
        distinct: ["usuarioEmail"],
        select: { usuarioEmail: true },
        orderBy: { usuarioEmail: "asc" },
      }),
      prisma.registroAuditoria.findMany({
        distinct: ["entidad"],
        select: { entidad: true },
        orderBy: { entidad: "asc" },
      }),
      prisma.registroAuditoria.findMany({
        distinct: ["accion"],
        select: { accion: true },
        orderBy: { accion: "asc" },
      }),
    ]);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Auditoría</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-600">
          Quién creó, editó o borró qué y cuándo, en todo el panel. {total}{" "}
          {total === 1 ? "registro" : "registros"}
          {hayFiltros ? " que coinciden con el filtro" : ""}
          {total > LIMITE_REGISTROS
            ? ` -- mostrando los ${LIMITE_REGISTROS} más recientes, acota con los filtros para ver otros.`
            : "."}
        </p>
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="usuario" className="text-xs font-medium text-neutral-500">
            Usuario
          </label>
          <select
            id="usuario"
            name="usuario"
            defaultValue={usuarioFiltro}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Todos</option>
            {usuariosDisponibles.map(({ usuarioEmail }) => (
              <option key={usuarioEmail} value={usuarioEmail}>
                {usuarioEmail}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="entidad" className="text-xs font-medium text-neutral-500">
            Sección
          </label>
          <select
            id="entidad"
            name="entidad"
            defaultValue={entidadFiltro}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Todas</option>
            {entidadesDisponibles.map(({ entidad: valor }) => (
              <option key={valor} value={valor}>
                {ETIQUETA_ENTIDAD[valor] ?? valor}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="accion" className="text-xs font-medium text-neutral-500">
            Acción
          </label>
          <select
            id="accion"
            name="accion"
            defaultValue={accionFiltro}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Todas</option>
            {accionesDisponibles.map(({ accion: valor }) => (
              <option key={valor} value={valor}>
                {ETIQUETA_ACCION[valor] ?? valor}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="desde" className="text-xs font-medium text-neutral-500">
            Desde
          </label>
          <input
            id="desde"
            type="date"
            name="desde"
            defaultValue={desde || ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="hasta" className="text-xs font-medium text-neutral-500">
            Hasta
          </label>
          <input
            id="hasta"
            type="date"
            name="hasta"
            defaultValue={hasta || ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </div>

        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Filtrar
        </button>
        {hayFiltros && (
          <Link
            href="/admin/auditoria"
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            Limpiar
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Sección</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {registros.map((registro) => (
              <tr key={registro.id} className="hover:bg-neutral-50">
                <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                  {formatearFechaHoraHonduras(registro.creadoEn)}
                </td>
                <td className="px-4 py-3 text-neutral-700">{registro.usuarioEmail}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      COLOR_ACCION[registro.accion] ??
                      "border-neutral-300 bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {ETIQUETA_ACCION[registro.accion] ?? registro.accion}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {ETIQUETA_ENTIDAD[registro.entidad] ?? registro.entidad}
                </td>
                <td className="px-4 py-3 text-neutral-600">{registro.detalle || "—"}</td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  {hayFiltros
                    ? "No hay registros que coincidan con el filtro."
                    : "Todavía no hay nada en la bitácora."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
