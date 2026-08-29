"use client";

import { useActionState, useMemo, useState } from "react";
import { crearPedido } from "../actions";
import { crearClienteInline } from "../../(solo-dueno)/clientes/actions";
import { calcularSubtotal, calcularTotalesPedido, type EntradaAnticipo } from "@/lib/pedidoTotales";
import { Combobox } from "@/components/admin/ui/Combobox";
import { claveDiaHonduras } from "@/lib/fecha";

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

export function NuevoPedidoForm({
  clientesIniciales,
  productos,
  clienteIdInicial,
}: {
  clientesIniciales: ClienteOpcion[];
  productos: ProductoOpcion[];
  clienteIdInicial: string;
}) {
  const [clientes, setClientes] = useState(clientesIniciales);
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  // Sigue el último cliente creado inline que ya se aplicó al formulario --
  // evita repetir el efecto secundario si el componente vuelve a renderizar
  // sin que estadoCliente.cliente haya cambiado de verdad.
  const [ultimoClienteInlineId, setUltimoClienteInlineId] = useState<string | null>(
    null
  );
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(
    clientesIniciales.length === 0
  );
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

  const [estadoCliente, formActionCliente, guardandoCliente] = useActionState(
    crearClienteInline,
    {}
  );
  const [estadoPedido, formActionPedido, guardandoPedido] = useActionState(
    crearPedido,
    {}
  );

  // Patrón recomendado por React para "ajustar estado cuando cambia una
  // prop/valor derivado" -- se llama a setState durante el render (no
  // dentro de un useEffect) y se evita el bucle infinito comparando contra
  // el último id ya aplicado. Ver
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (
    estadoCliente.cliente &&
    estadoCliente.cliente.id !== ultimoClienteInlineId
  ) {
    setUltimoClienteInlineId(estadoCliente.cliente.id);
    setClientes((actuales) => [estadoCliente.cliente!, ...actuales]);
    setClienteId(estadoCliente.cliente.id);
    setMostrarNuevoCliente(false);
  }

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
        subtexto: [p.tipo, p.categoria, p.diseno].filter(Boolean).join(" · ") +
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
            nombre: producto?.nombre ?? "",
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
  const itemsJson = JSON.stringify(itemsValidos);

  return (
    <div className="space-y-6">
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
          <form action={formActionCliente} className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm text-neutral-700">
              Nombre
              <input name="nombre" required className={`${inputClass} mt-1 w-48`} />
            </label>
            <label className="text-sm text-neutral-700">
              Teléfono
              <input name="telefono" required className={`${inputClass} mt-1 w-40`} />
            </label>
            <button
              type="submit"
              disabled={guardandoCliente}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
            >
              {guardandoCliente ? "Creando…" : "Crear y usar"}
            </button>
            {clientes.length > 0 && (
              <button
                type="button"
                onClick={() => setMostrarNuevoCliente(false)}
                className="text-sm text-neutral-500 hover:text-neutral-800"
              >
                Cancelar
              </button>
            )}
            {estadoCliente.error && (
              <p className="w-full text-sm text-red-600">{estadoCliente.error}</p>
            )}
          </form>
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

      <form action={formActionPedido}>
        <input type="hidden" name="clienteId" value={clienteId} />
        <input type="hidden" name="itemsJson" value={itemsJson} />
        <input type="hidden" name="modoAnticipo" value={modoAnticipo} />
        <input type="hidden" name="porcentajeAnticipo" value={porcentajeAnticipo} />
        <input type="hidden" name="montoAnticipoFijo" value={montoAnticipoFijo} />
        <input type="hidden" name="fechaPrometida" value={fechaPrometida} />
        <input type="hidden" name="notas" value={notas} />

        {estadoPedido.error && (
          <p className="mb-3 text-sm text-red-600">{estadoPedido.error}</p>
        )}

        <button
          type="submit"
          disabled={guardandoPedido || !clienteId || itemsValidos.length === 0}
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {guardandoPedido ? "Creando pedido…" : "Crear pedido"}
        </button>
      </form>
    </div>
  );
}
