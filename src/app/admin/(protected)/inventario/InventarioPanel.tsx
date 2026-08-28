"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/admin/ui/Modal";
import { Tabs } from "@/components/admin/ui/Tabs";
import { useToast } from "@/components/admin/ui/Toast";
import { NuevoMaterialForm } from "./NuevoMaterialForm";
import { NuevoMovimientoForm } from "./NuevoMovimientoForm";

export type MaterialResumen = {
  id: string;
  nombre: string;
  unidadMedida: string;
  cantidadPorUnidad: string;
  cantidadActual: string;
  cantidadMinima: string;
  costo: string | null;
  activo: boolean;
  proveedorNombre: string | null;
};

/**
 * Toda la parte dinámica de Inventario: tarjetas de materiales (en vez de
 * una tabla densa), y los dos modales de "Nuevo material" / "Registrar
 * movimiento" que reemplazan la navegación a páginas aparte. Registrar un
 * movimiento desde la tarjeta de un material específico ya trae ese
 * material preseleccionado -- ver NuevoMovimientoForm.tsx.
 *
 * `tabMovimientos` llega ya armado desde page.tsx (Server Component) porque
 * es una tabla estática con formularios de borrado; mismo patrón que
 * `tabEntregas` en pedidos/[id]/page.tsx.
 */
export function InventarioPanel({
  materiales,
  proveedores,
  materialesBajos,
  tabMovimientos,
}: {
  materiales: MaterialResumen[];
  proveedores: { id: string; nombre: string }[];
  materialesBajos: { id: string; nombre: string }[];
  tabMovimientos: ReactNode;
}) {
  const { mostrarToast } = useToast();
  const [modalMaterialAbierto, setModalMaterialAbierto] = useState(false);
  const [modalMovimientoAbierto, setModalMovimientoAbierto] = useState(false);
  const [materialParaMovimiento, setMaterialParaMovimiento] = useState<string | null>(
    null
  );

  function abrirMovimiento(materialId: string | null) {
    setMaterialParaMovimiento(materialId);
    setModalMovimientoAbierto(true);
  }

  const materialesParaFormulario = useMemo(
    () =>
      materiales.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        unidadMedida: m.unidadMedida,
        cantidadPorUnidad: m.cantidadPorUnidad,
        cantidadActual: m.cantidadActual,
      })),
    [materiales]
  );

  // Redondea a 2 decimales pero quita ceros de sobra (20.00 -> "20",
  // 19.50 -> "19.5") -- pensado para el número grande de la tarjeta, que
  // casi siempre va a ser un entero de bolsas/unidades.
  function formatearCantidad(n: number) {
    return Number(n.toFixed(2)).toString();
  }

  function usaConversion(m: MaterialResumen) {
    return Number(m.cantidadPorUnidad) !== 1;
  }

  const materialesGrid = (
    <div>
      {materiales.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          Todavía no hay materiales registrados.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {materiales.map((m) => {
          const bajo =
            m.activo &&
            Number(m.cantidadMinima) > 0 &&
            Number(m.cantidadActual) <= Number(m.cantidadMinima);
          return (
            <div
              key={m.id}
              className={`rounded-lg border p-4 ${
                !m.activo
                  ? "border-neutral-200 bg-neutral-50 opacity-70"
                  : bajo
                    ? "border-amber-200 bg-amber-50"
                    : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/admin/inventario/${m.id}`}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {m.nombre}
                </Link>
                {!m.activo && (
                  <span className="shrink-0 rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                    Inactivo
                  </span>
                )}
                {m.activo && bajo && (
                  <span className="shrink-0 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Stock bajo
                  </span>
                )}
              </div>

              {usaConversion(m) ? (
                <>
                  <p className="mt-2 text-2xl font-semibold text-neutral-900">
                    {formatearCantidad(Number(m.cantidadActual) / Number(m.cantidadPorUnidad))}{" "}
                    <span className="text-sm font-normal text-neutral-500">unidades</span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    = {m.cantidadActual} {m.unidadMedida} ({m.cantidadPorUnidad} {m.unidadMedida}{" "}
                    por unidad)
                  </p>
                </>
              ) : (
                <p className="mt-2 text-2xl font-semibold text-neutral-900">
                  {m.cantidadActual}{" "}
                  <span className="text-sm font-normal text-neutral-500">
                    {m.unidadMedida}
                  </span>
                </p>
              )}
              {Number(m.cantidadMinima) > 0 && (
                <p className="text-xs text-neutral-500">
                  mínimo: {m.cantidadMinima} {m.unidadMedida}
                </p>
              )}
              {(m.proveedorNombre || m.costo) && (
                <p className="mt-1 text-xs text-neutral-500">
                  {[m.proveedorNombre, m.costo ? `L. ${m.costo}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <div className="mt-3 flex gap-2">
                {m.activo && (
                  <button
                    type="button"
                    onClick={() => abrirMovimiento(m.id)}
                    className="flex-1 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
                  >
                    + Movimiento
                  </button>
                )}
                <Link
                  href={`/admin/inventario/${m.id}`}
                  className={`rounded-md border border-neutral-300 px-3 py-1.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-100 ${
                    m.activo ? "" : "flex-1"
                  }`}
                >
                  Detalle
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Inventario</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {materiales.length} {materiales.length === 1 ? "material" : "materiales"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/inventario/proveedores"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Proveedores
          </Link>
          <button
            type="button"
            onClick={() => setModalMaterialAbierto(true)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            + Nuevo material
          </button>
          <button
            type="button"
            onClick={() => abrirMovimiento(null)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            + Registrar movimiento
          </button>
        </div>
      </div>

      {materialesBajos.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span className="font-medium">Stock bajo:</span>{" "}
          {materialesBajos.map((m) => m.nombre).join(", ")}
        </div>
      )}

      <div className="mt-6">
        <Tabs
          tabs={[
            { clave: "materiales", etiqueta: "Materiales", contenido: materialesGrid },
            { clave: "movimientos", etiqueta: "Movimientos", contenido: tabMovimientos },
          ]}
        />
      </div>

      <Modal
        isOpen={modalMaterialAbierto}
        onClose={() => setModalMaterialAbierto(false)}
        titulo="Nuevo material"
      >
        <NuevoMaterialForm
          proveedores={proveedores}
          onSuccess={() => {
            setModalMaterialAbierto(false);
            mostrarToast("Material creado.");
          }}
        />
      </Modal>

      <Modal
        isOpen={modalMovimientoAbierto}
        onClose={() => setModalMovimientoAbierto(false)}
        titulo="Registrar movimiento"
      >
        <NuevoMovimientoForm
          materiales={materialesParaFormulario}
          proveedores={proveedores}
          materialIdInicial={materialParaMovimiento}
          onSuccess={() => {
            setModalMovimientoAbierto(false);
            mostrarToast("Movimiento registrado.");
          }}
        />
      </Modal>
    </div>
  );
}
