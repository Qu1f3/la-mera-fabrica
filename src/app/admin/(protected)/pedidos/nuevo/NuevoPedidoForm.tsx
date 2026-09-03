"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/admin/ui/Toast";
import { calcularSubtotal, calcularTotalesPedido, type EntradaAnticipo } from "@/lib/pedidoTotales";
import { Combobox } from "@/components/admin/ui/Combobox";
import { claveDiaHonduras } from "@/lib/fecha";
import { encolarPedido, generarIdLocal } from "@/lib/offline/sync";
import { generarCodigoPedidoCliente } from "@/lib/pedidoCodigoCliente";

type ClienteOpcion = { id: string; nombre: string; telefono: string };
type ProductoOpcion = {
  id: string;
  nombre: string;
  sku: string | null;
  tipo: string;
  categoria: string | null;
  diseno: string | null;
  precioActual: number;
  imagenUrl?: string;
};

type FilaItem = {
  key: string;
  productoId: string;
  cantidad: string;
  precioUnitario: string;
  color: string;
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

function nuevaFila(): FilaItem {
  return {
    key: crypto.randomUUID(),
    productoId: "",
    cantidad: "1",
    precioUnitario: "0",
    color: "",
  };
}

/**
 * Antes este formulario eran dos Server Actions encadenadas
 * (crearClienteInline y luego crearPedido, cada una un viaje aparte al
 * servidor) y, al terminar bien, redirigía a /admin/pedidos/[id]. Desde la
 * Fase 4 de "modo sin conexión" (ver propuesta-modo-offline.md), todo --
 * crear el cliente si hace falta, y crear el pedido -- se manda junto en
 * una sola llamada a encolarPedido(), que funciona igual con o sin señal
 * (ver src/lib/pedidos/crear.ts, que hace las dos cosas en una misma
 * transacción). Solo se navega al detalle si el pedido de verdad quedó
 * guardado en el servidor al momento de enviarlo -- si quedó pendiente
 * (sin conexión, o el servidor lo rechazó), el formulario se queda en la
 * página y se limpia, igual que Producción/Extras/Inventario, porque la
 * página de detalle de un pedido que todavía no existe del otro lado no
 * puede cargar.
 */
export function NuevoPedidoForm({
  clientesIniciales,
  productos,
  clienteIdInicial,
}: {
  clientesIniciales: ClienteOpcion[];
  productos: ProductoOpcion[];
  clienteIdInicial: string;
}) {
  const { mostrarToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [clientes] = useState(clientesIniciales);
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(
    clientesIniciales.length === 0
  );
  const [nombreClienteNuevo, setNombreClienteNuevo] = useState("");
  const [telefonoClienteNuevo, setTelefonoClienteNuevo] = useState("");
  const [items, setItems] = useState<FilaItem[]>([nuevaFila()]);
  const [modoAnticipo, setModoAnticipo] = useState<"PORCENTAJE" | "MONTO_FIJO">(
    "PORCENTAJE"
  );
  const [porcentajeAnticipo, setPorcentajeAnticipo] = useState("60");
  const [montoAnticipoFijo, setMontoAnticipoFijo] = useState("");
  // Por defecto, la fecha de hoy (hora de Honduras) -- el administrador la
  // puede cambiar si la fecha prometida real es otro día; nunca se calcula
  // sola después de este valor inicial (ver instrucción: "La fecha
  // prometida NO debe calcularse automáticamente").
  const [fechaPrometida, setFechaPrometida] = useState(() =>
    claveDiaHonduras(new Date())
  );
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function actualizarFila(key: string, cambios: Partial<FilaItem>) {
    setItems((actuales) =>
      actuales.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila))
    );
  }

  function seleccionarProducto(key: string, productoId: string) {
    const producto = productos.find((p) => p.id === productoId);
    actualizarFila(key, {
      productoId,
      precioUnitario: producto ? String(producto.precioActual) : "0",
    });
  }

  function quitarFila(key: string) {
    setItems((actuales) =>
      actuales.length > 1 ? actuales.filter((fila) => fila.key !== key) : actuales
    );
  }

  const opcionesProducto = useMemo(
    () =>
      productos.map((p) => ({
        id: p.id,
        etiqueta: p.sku ? `${p.nombre} (${p.sku})` : p.nombre,
        subtexto:
          [p.tipo, p.categoria, p.diseno].filter(Boolean).join(" · ") +
          ` — L. ${p.precioActual}`,
        imagenUrl: p.imagenUrl,
      })),
    [productos]
  );

  const opcionesCliente = useMemo(
    () =>
      clientes.map((c) => ({
        id: c.id,
        etiqueta: c.nombre,
        subtexto: c.telefono,
      })),
    [clientes]
  );

  const itemsValidos = useMemo(
    () =>
      items
        .filter((fila) => fila.productoId && Number(fila.cantidad) > 0)
        .map((fila) => {
          const producto = productos.find((p) => p.id === fila.productoId);
          return {
            productoId: fila.productoId,
            categoria: producto?.categoria ?? null,
            diseno: producto?.diseno ?? null,
            color: fila.color.trim() || null,
            cantidad: Number(fila.cantidad),
            precioUnitario: Number(fila.precioUnitario),
          };
        }),
    [items, productos]
  );

  const entradaAnticipo: EntradaAnticipo =
    modoAnticipo === "MONTO_FIJO"
      ? { modo: "MONTO_FIJO", monto: Number(montoAnticipoFijo) || 0 }
      : { modo: "PORCENTAJE", porcentaje: Number(porcentajeAnticipo) || 0 };
  const totales = calcularTotalesPedido(itemsValidos, entradaAnticipo);

  const clienteListo = mostrarNuevoCliente
    ? nombreClienteNuevo.trim() !== "" && telefonoClienteNuevo.trim() !== ""
    : clienteId !== "";

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    if (!clienteListo) {
      setError("Selecciona o crea un cliente.");
      return;
    }
    if (itemsValidos.length === 0) {
      setError("Agrega al menos un producto con cantidad y precio válidos.");
      return;
    }
    // Mismas validaciones que hace registrarPedidoCompartido -- ver
    // src/lib/pedidos/crear.ts -- se repiten acá para avisar al instante en
    // vez de que la persona se entere hasta que el servidor lo rechace
    // (posiblemente horas después, si se guardó sin conexión).
    if (modoAnticipo === "MONTO_FIJO") {
      const monto = Number(montoAnticipoFijo);
      const totalItems = itemsValidos.reduce(
        (suma, item) => suma + item.cantidad * item.precioUnitario,
        0
      );
      if (!Number.isFinite(monto) || monto < 0) {
        setError("El monto de anticipo no es válido.");
        return;
      }
      if (monto > totalItems) {
        setError("El anticipo no puede ser mayor que el total del pedido.");
        return;
      }
    } else {
      const porcentaje = Number(porcentajeAnticipo);
      if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        setError("El porcentaje de anticipo debe estar entre 0 y 100.");
        return;
      }
    }

    setPending(true);
    try {
      const idPedido = generarIdLocal();
      const { pedidoId, sincronizado } = await encolarPedido({
        idPedido,
        codigo: generarCodigoPedidoCliente(),
        clienteId: mostrarNuevoCliente ? undefined : clienteId,
        clienteNuevo: mostrarNuevoCliente
          ? {
              id: generarIdLocal(),
              nombre: nombreClienteNuevo.trim(),
              telefono: telefonoClienteNuevo.trim(),
            }
          : undefined,
        items: itemsValidos,
        modoAnticipo,
        porcentajeAnticipo: Number(porcentajeAnticipo) || 0,
        montoAnticipoFijo: Number(montoAnticipoFijo) || 0,
        fechaPrometidaInput: fechaPrometida,
        notas: notas.trim() || null,
        idIngreso: generarIdLocal(),
      });

      if (sincronizado) {
        mostrarToast("Pedido creado.");
        // Navegación dura (no router de Next) para que el service worker
        // la intercepte igual que cualquier otra ruta sin conexión -- ver
        // AdminNav.tsx y propuesta-modo-offline.md.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a propósito, ver comentario arriba
        window.location.href = `/admin/pedidos/${pedidoId}`;
        return;
      }

      mostrarToast(
        "Pedido guardado en este dispositivo -- se sincroniza solo al volver la señal."
      );
      formRef.current?.reset();
      setItems([nuevaFila()]);
      setNotas("");
      setPorcentajeAnticipo("60");
      setMontoAnticipoFijo("");
      setFechaPrometida(claveDiaHonduras(new Date()));
      setNombreClienteNuevo("");
      setTelefonoClienteNuevo("");
      if (mostrarNuevoCliente) {
        // El cliente que se acaba de escribir quedó sin conexión, en cola
        // -- no aparece todavía en la lista de clientes existentes de este
        // formulario (necesitaría volver a cargar la página con señal),
        // así que se deja el modo "nuevo cliente" listo para el siguiente
        // pedido en vez de dejar seleccionado un cliente que en este
        // dispositivo todavía no existe de verdad.
        setClienteId("");
      }
    } catch {
      setError("No se pudo guardar en este dispositivo. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={alEnviar} className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Cliente</h2>
        {!mostrarNuevoCliente ? (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="flex-1 text-sm text-neutral-700">
              Cliente existente
              <Combobox
                opciones={opcionesCliente}
                valorId={clienteId}
                onSeleccionar={setClienteId}
                placeholder="Escribe para buscar…"
                className={`${inputClass} mt-1`}
              />
            </label>
            <button
              type="button"
              onClick={() => setMostrarNuevoCliente(true)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              + Nuevo cliente
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm text-neutral-700">
              Nombre
              <input
                value={nombreClienteNuevo}
                onChange={(evento) => setNombreClienteNuevo(evento.target.value)}
                className={`${inputClass} mt-1 w-48`}
              />
            </label>
            <label className="text-sm text-neutral-700">
              Teléfono
              <input
                value={telefonoClienteNuevo}
                onChange={(evento) => setTelefonoClienteNuevo(evento.target.value)}
                className={`${inputClass} mt-1 w-40`}
              />
            </label>
            {clientes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMostrarNuevoCliente(false);
                  setNombreClienteNuevo("");
                  setTelefonoClienteNuevo("");
                }}
                className="text-sm text-neutral-500 hover:text-neutral-800"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Productos</h2>
        <div className="mt-3 space-y-3">
          {items.map((fila) => {
            const producto = productos.find((p) => p.id === fila.productoId);
            const subtotal = producto
              ? calcularSubtotal(
                  Number(fila.cantidad) || 0,
                  Number(fila.precioUnitario) || 0
                )
              : 0;
            return (
              <div
                key={fila.key}
                className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-12 sm:items-end"
              >
                <div className="sm:col-span-5">
                  <p className="text-xs text-neutral-500">Producto</p>
                  <Combobox
                    opciones={opcionesProducto}
                    valorId={fila.productoId}
                    onSeleccionar={(productoId) => seleccionarProducto(fila.key, productoId)}
                    placeholder="Escribe para buscar…"
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <label className="text-xs text-neutral-500 sm:col-span-2">
                  Cantidad
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={fila.cantidad}
                    onChange={(evento) => actualizarFila(fila.key, { cantidad: evento.target.value })}
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="text-xs text-neutral-500 sm:col-span-2">
                  Precio unitario
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fila.precioUnitario}
                    onChange={(evento) =>
                      actualizarFila(fila.key, { precioUnitario: evento.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="text-xs text-neutral-500 sm:col-span-2">
                  Color (opcional)
                  <input
                    value={fila.color}
                    onChange={(evento) => actualizarFila(fila.key, { color: evento.target.value })}
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <div className="flex items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-end">
                  <span className="text-sm font-medium text-neutral-700">
                    L. {subtotal.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarFila(fila.key)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setItems((actuales) => [...actuales, nuevaFila()])}
          className="mt-3 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          + Agregar producto
        </button>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Anticipo y fecha
        </h2>
        <div className="mt-3">
          <span className="text-sm text-neutral-700">Anticipo</span>
          <div className="mt-1 inline-flex rounded-md border border-neutral-300 p-0.5">
            <button
              type="button"
              onClick={() => setModoAnticipo("PORCENTAJE")}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                modoAnticipo === "PORCENTAJE"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              % del total
            </button>
            <button
              type="button"
              onClick={() => setModoAnticipo("MONTO_FIJO")}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                modoAnticipo === "MONTO_FIJO"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              Monto fijo (L.)
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {modoAnticipo === "PORCENTAJE" ? (
            <label className="text-sm text-neutral-700">
              % de anticipo
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={porcentajeAnticipo}
                onChange={(evento) => setPorcentajeAnticipo(evento.target.value)}
                className={`${inputClass} mt-1`}
              />
            </label>
          ) : (
            <label className="text-sm text-neutral-700">
              Monto de anticipo (L.)
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej: 3000"
                value={montoAnticipoFijo}
                onChange={(evento) => setMontoAnticipoFijo(evento.target.value)}
                className={`${inputClass} mt-1`}
              />
            </label>
          )}
          <label className="text-sm text-neutral-700">
            Fecha prometida (opcional)
            <input
              type="date"
              value={fechaPrometida}
              onChange={(evento) => setFechaPrometida(evento.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>
        <label className="mt-3 block text-sm text-neutral-700">
          Notas (opcional)
          <textarea
            value={notas}
            onChange={(evento) => setNotas(evento.target.value)}
            rows={2}
            className={`${inputClass} mt-1`}
          />
        </label>

        <dl className="mt-4 grid grid-cols-1 gap-2 rounded-md bg-neutral-50 p-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-neutral-500">Total</dt>
            <dd className="text-base font-semibold text-neutral-900">
              L. {totales.montoTotal.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Anticipo ({totales.porcentajeAnticipo.toFixed(1)}%)</dt>
            <dd className="text-base font-semibold text-neutral-900">
              L. {totales.montoAnticipo.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Saldo</dt>
            <dd className="text-base font-semibold text-neutral-900">
              L. {totales.saldoPendiente.toFixed(2)}
            </dd>
          </div>
        </dl>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending || !clienteListo || itemsValidos.length === 0}
        className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Creando pedido…" : "Crear pedido"}
      </button>
    </form>
  );
}
