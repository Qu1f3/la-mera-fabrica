"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/admin/ui/Toast";
import { Combobox } from "@/components/admin/ui/Combobox";
import { encolarProduccion, generarIdLocal } from "@/lib/offline/sync";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

type LineaProducto = {
  /** Solo para el key de React y para poder quitar la línea correcta -- no se manda al servidor. */
  key: string;
  productoId: string;
  cantidadProducida: string;
  unidadesDefectuosas: string;
};

function lineaVacia(): LineaProducto {
  return { key: generarIdLocal(), productoId: "", cantidadProducida: "", unidadesDefectuosas: "0" };
}

/**
 * Antes este formulario mandaba a una Server Action (useActionState) y, al
 * terminar bien, redirigía a /admin/produccion. Desde la Fase 2 de "modo
 * sin conexión" (ver propuesta-modo-offline.md), guarda con
 * encolarProduccion() -- que funciona igual con o sin señal -- y se queda
 * en la página limpiando el formulario (mismo patrón que ya usaba
 * NuevoPagoExtraForm.tsx en Extras), en vez de redirigir: la lista de
 * /admin/produccion necesita conexión para volver a cargar, así que
 * redirigir ahí justo después de un registro hecho sin señal dejaría a
 * quien lo usa mirando una pantalla que no carga.
 *
 * Un mismo empleado puede hacer más de un producto en el mismo día, así
 * que el formulario permite agregar varias "líneas de producto" (cada una
 * con su propio producto/cantidad/defectuosas) y las manda como registros
 * de producción independientes -- uno por línea, todos con
 * encolarProduccion(), en el mismo patrón de "cada uno se encola por su
 * cuenta y se sincroniza solo" que ya usa el resto de esta pantalla. La
 * mezcla (si aplica) se manda una sola vez, junto con la primera línea,
 * para no crear un RegistroMezcla por cada producto.
 */
export function NuevoRegistroProduccionForm({
  empleados,
  productos,
  montoMezclaDefault,
}: {
  empleados: { id: string; nombre: string }[];
  productos: {
    id: string;
    nombre: string;
    sku: string | null;
    imagenUrl?: string;
  }[];
  montoMezclaDefault: string;
}) {
  const { mostrarToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [empleadoId, setEmpleadoId] = useState("");
  const [lineas, setLineas] = useState<LineaProducto[]>([lineaVacia()]);
  const [hizoMezcla, setHizoMezcla] = useState(false);
  const [mostrarNotas, setMostrarNotas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const opcionesEmpleado = useMemo(
    () => empleados.map((e) => ({ id: e.id, etiqueta: e.nombre })),
    [empleados]
  );
  const opcionesProducto = useMemo(
    () =>
      productos.map((p) => ({
        id: p.id,
        etiqueta: p.sku ? `${p.nombre} (${p.sku})` : p.nombre,
        imagenUrl: p.imagenUrl,
      })),
    [productos]
  );

  function actualizarLinea(key: string, cambios: Partial<LineaProducto>) {
    setLineas((actuales) => actuales.map((l) => (l.key === key ? { ...l, ...cambios } : l)));
  }

  function agregarLinea() {
    setLineas((actuales) => [...actuales, lineaVacia()]);
  }

  function quitarLinea(key: string) {
    setLineas((actuales) => (actuales.length > 1 ? actuales.filter((l) => l.key !== key) : actuales));
  }

  const hayProductoElegido = lineas.some((l) => l.productoId);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const formData = new FormData(evento.currentTarget);
    const notas = String(formData.get("notas") || "").trim() || null;
    const montoMezcla = Number(formData.get("montoMezcla"));

    // Mismas validaciones que antes hacía la Server Action -- ahora tienen
    // que vivir acá porque el envío nunca pasa por ella (el servidor las
    // vuelve a hacer de todos modos cuando el registro llega, ver
    // src/lib/produccion/registrar.ts, pero para entonces ya pasaron horas
    // y no hay forma de corregir el formulario a mano).
    if (!empleadoId) {
      setError("Selecciona un empleado.");
      return;
    }

    // Las líneas que quedaron sin producto elegido (ej: se agregó una de
    // más por error) se ignoran en silencio -- no cuentan como error.
    const lineasProducto = lineas.filter((l) => l.productoId);

    if (lineasProducto.length === 0 && !hizoMezcla) {
      setError("Selecciona un producto o marca que hizo mezcla.");
      return;
    }

    const vistos = new Set<string>();
    for (let i = 0; i < lineasProducto.length; i++) {
      const linea = lineasProducto[i];
      const numeroLinea = i + 1;
      if (vistos.has(linea.productoId)) {
        const nombre = productos.find((p) => p.id === linea.productoId)?.nombre ?? "ese producto";
        setError(`Ya agregaste ${nombre} arriba -- cambia la cantidad en esa línea en vez de repetirla.`);
        return;
      }
      vistos.add(linea.productoId);

      const cantidadProducida = Number(linea.cantidadProducida);
      const unidadesDefectuosas = Number(linea.unidadesDefectuosas || 0);
      if (!Number.isInteger(cantidadProducida) || cantidadProducida <= 0) {
        setError(`Línea ${numeroLinea}: la cantidad producida debe ser un número entero mayor a 0.`);
        return;
      }
      if (!Number.isInteger(unidadesDefectuosas) || unidadesDefectuosas < 0) {
        setError(`Línea ${numeroLinea}: las unidades defectuosas deben ser un número entero, 0 o más.`);
        return;
      }
      if (unidadesDefectuosas > cantidadProducida) {
        setError(`Línea ${numeroLinea}: las unidades defectuosas no pueden ser más que lo producido.`);
        return;
      }
    }
    if (hizoMezcla && (!Number.isFinite(montoMezcla) || montoMezcla <= 0)) {
      setError("El monto de mezcla no es válido.");
      return;
    }

    setPending(true);
    try {
      if (lineasProducto.length === 0) {
        // Solo mezcla, sin ningún producto -- un único registro.
        await encolarProduccion({
          idMezcla: generarIdLocal(),
          empleadoId,
          productoId: "",
          cantidadProducida: 0,
          unidadesDefectuosas: 0,
          notas,
          hizoMezcla: true,
          montoMezcla,
        });
      } else {
        // Un registro de producción por línea -- todos con el mismo
        // empleado y las mismas notas. La mezcla (si aplica) va solo en la
        // primera línea para no duplicar el RegistroMezcla.
        for (let i = 0; i < lineasProducto.length; i++) {
          const linea = lineasProducto[i];
          const esPrimera = i === 0;
          await encolarProduccion({
            idRegistro: generarIdLocal(),
            idMezcla: esPrimera && hizoMezcla ? generarIdLocal() : undefined,
            empleadoId,
            productoId: linea.productoId,
            cantidadProducida: Number(linea.cantidadProducida),
            unidadesDefectuosas: Number(linea.unidadesDefectuosas || 0),
            notas,
            hizoMezcla: esPrimera && hizoMezcla,
            montoMezcla: esPrimera && hizoMezcla ? montoMezcla : 0,
          });
        }
      }

      mostrarToast(
        lineasProducto.length > 1
          ? `Se guardaron ${lineasProducto.length} registros de producción.`
          : "Registro de producción guardado."
      );
      formRef.current?.reset();
      setEmpleadoId("");
      setLineas([lineaVacia()]);
      setHizoMezcla(false);
      setMostrarNotas(false);
    } catch {
      setError("No se pudo guardar en este dispositivo. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={alEnviar} className="mt-3 grid grid-cols-1 gap-3">
      <label className="text-xs text-neutral-500">
        ¿Quién trabajó?
        <Combobox
          opciones={opcionesEmpleado}
          valorId={empleadoId}
          onSeleccionar={setEmpleadoId}
          placeholder="Escribe el nombre…"
          className={`${inputClass} mt-1`}
        />
      </label>

      <div className="grid grid-cols-1 gap-3">
        {lineas.map((linea, indice) => (
          <div key={linea.key} className="rounded-md border border-neutral-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">
                Producto {lineas.length > 1 ? indice + 1 : ""}
              </span>
              {lineas.length > 1 && (
                <button
                  type="button"
                  onClick={() => quitarLinea(linea.key)}
                  className="text-xs font-medium text-neutral-400 hover:text-red-600"
                >
                  Quitar
                </button>
              )}
            </div>
            <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs text-neutral-500 sm:col-span-2">
                ¿Qué producto hizo?
                <Combobox
                  opciones={opcionesProducto}
                  valorId={linea.productoId}
                  onSeleccionar={(id) => actualizarLinea(linea.key, { productoId: id })}
                  placeholder="Escribe para buscar…"
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs text-neutral-500">
                ¿Cuántas piezas hizo?{!linea.productoId && " (si va a registrar producción)"}
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={linea.cantidadProducida}
                  onChange={(e) => actualizarLinea(linea.key, { cantidadProducida: e.target.value })}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-xs text-neutral-500">
                ¿Cuántas salieron malas? (opcional)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={linea.unidadesDefectuosas}
                  onChange={(e) => actualizarLinea(linea.key, { unidadesDefectuosas: e.target.value })}
                  className={`${inputClass} mt-1`}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={agregarLinea}
        className="text-left text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:underline"
      >
        + Agregar otro producto
      </button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mostrarNotas ? (
          <label className="text-xs text-neutral-500 sm:col-span-2">
            Notas (opcional)
            <textarea name="notas" rows={2} className={`${inputClass} mt-1`} />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setMostrarNotas(true)}
            className="text-left text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:underline sm:col-span-2"
          >
            + Agregar una nota (opcional)
          </button>
        )}

        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <input
              type="checkbox"
              name="hizoMezcla"
              checked={hizoMezcla}
              onChange={(e) => setHizoMezcla(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            También hizo mezcla hoy
          </label>
          {hizoMezcla && (
            <label className="mt-2 block text-xs text-neutral-500">
              Monto de mezcla
              <input
                type="number"
                name="montoMezcla"
                min="0"
                step="0.01"
                defaultValue={montoMezclaDefault}
                className={`${inputClass} mt-1 sm:w-40`}
              />
            </label>
          )}
        </div>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

        <button
          type="submit"
          disabled={pending || !empleadoId || (!hayProductoElegido && !hizoMezcla)}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:col-span-2 sm:w-fit"
        >
          {pending ? "Guardando…" : "Registrar"}
        </button>
      </div>
    </form>
  );
}
