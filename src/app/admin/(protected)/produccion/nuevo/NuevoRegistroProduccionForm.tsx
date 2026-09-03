"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/admin/ui/Toast";
import { Combobox } from "@/components/admin/ui/Combobox";
import { encolarProduccion, generarIdLocal } from "@/lib/offline/sync";

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

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
  const [productoId, setProductoId] = useState("");
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

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const formData = new FormData(evento.currentTarget);
    const cantidadProducida = Number(formData.get("cantidadProducida"));
    const unidadesDefectuosas = Number(formData.get("unidadesDefectuosas") || 0);
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
    const registraProduccion = Boolean(productoId);
    if (!registraProduccion && !hizoMezcla) {
      setError("Selecciona un producto o marca que hizo mezcla.");
      return;
    }
    if (registraProduccion) {
      if (!Number.isInteger(cantidadProducida) || cantidadProducida <= 0) {
        setError("La cantidad producida debe ser un número entero mayor a 0.");
        return;
      }
      if (!Number.isInteger(unidadesDefectuosas) || unidadesDefectuosas < 0) {
        setError("Las unidades defectuosas deben ser un número entero, 0 o más.");
        return;
      }
      if (unidadesDefectuosas > cantidadProducida) {
        setError("Las unidades defectuosas no pueden ser más que lo producido.");
        return;
      }
    }
    if (hizoMezcla && (!Number.isFinite(montoMezcla) || montoMezcla <= 0)) {
      setError("El monto de mezcla no es válido.");
      return;
    }

    setPending(true);
    try {
      await encolarProduccion({
        idRegistro: registraProduccion ? generarIdLocal() : undefined,
        idMezcla: hizoMezcla ? generarIdLocal() : undefined,
        empleadoId,
        productoId,
        cantidadProducida: registraProduccion ? cantidadProducida : 0,
        unidadesDefectuosas: registraProduccion ? unidadesDefectuosas : 0,
        notas,
        hizoMezcla,
        montoMezcla: hizoMezcla ? montoMezcla : 0,
      });
      mostrarToast("Registro de producción guardado.");
      formRef.current?.reset();
      setEmpleadoId("");
      setProductoId("");
      setHizoMezcla(false);
      setMostrarNotas(false);
    } catch {
      setError("No se pudo guardar en este dispositivo. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={alEnviar} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <label className="text-xs text-neutral-500">
        ¿Qué producto hizo?
        <Combobox
          opciones={opcionesProducto}
          valorId={productoId}
          onSeleccionar={setProductoId}
          placeholder="Escribe para buscar…"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        ¿Cuántas piezas hizo?{!productoId && " (si va a registrar producción)"}
        <input
          type="number"
          name="cantidadProducida"
          min="1"
          step="1"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="text-xs text-neutral-500">
        ¿Cuántas salieron malas? (opcional)
        <input
          type="number"
          name="unidadesDefectuosas"
          min="0"
          step="1"
          defaultValue="0"
          className={`${inputClass} mt-1`}
        />
      </label>
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
        disabled={pending || !empleadoId || (!productoId && !hizoMezcla)}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:col-span-2 sm:w-fit"
      >
        {pending ? "Guardando…" : "Registrar"}
      </button>
    </form>
  );
}
