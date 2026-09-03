import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { obtenerAdminUsuario } from "@/lib/supabase/adminUsuario";
import { registrarPedidoCompartido, type ItemPedidoInput } from "@/lib/pedidos/crear";

export const dynamic = "force-dynamic";

function fechaValidaOUndefined(valor: unknown): Date | undefined {
  if (!valor) return undefined;
  const fecha = new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

function parsearItems(valor: unknown): ItemPedidoInput[] | null {
  if (!Array.isArray(valor)) return null;
  const items: ItemPedidoInput[] = [];
  for (const item of valor) {
    if (
      !item ||
      typeof item.productoId !== "string" ||
      !item.productoId ||
      typeof item.cantidad !== "number" ||
      !(item.cantidad > 0) ||
      typeof item.precioUnitario !== "number" ||
      item.precioUnitario < 0
    ) {
      return null;
    }
    items.push({
      productoId: item.productoId,
      categoria: item.categoria ? String(item.categoria) : null,
      diseno: item.diseno ? String(item.diseno) : null,
      color: item.color ? String(item.color) : null,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
    });
  }
  return items;
}

/**
 * Puerta de entrada ESTABLE para crear un pedido (con cliente existente o
 * cliente nuevo en el mismo paso) -- mismo criterio que
 * /api/offline/produccion, /extras e /inventario. Ver
 * propuesta-modo-offline.md, Fase 4.
 */
export async function POST(request: Request) {
  let adminUsuarioId: string;
  try {
    const user = await requireAdmin();
    adminUsuarioId = (await obtenerAdminUsuario(user)).id;
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const datos = (body ?? {}) as Record<string, unknown>;

  const items = parsearItems(datos.items);
  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "Agrega al menos un producto con cantidad y precio válidos." },
      { status: 400 }
    );
  }

  const clienteId = datos.clienteId ? String(datos.clienteId).trim() : undefined;
  const clienteNuevoRaw = datos.clienteNuevo as
    | { id?: unknown; nombre?: unknown; telefono?: unknown }
    | undefined;
  const clienteNuevo =
    clienteNuevoRaw && clienteNuevoRaw.nombre && clienteNuevoRaw.telefono
      ? {
          id: clienteNuevoRaw.id ? String(clienteNuevoRaw.id) : undefined,
          nombre: String(clienteNuevoRaw.nombre),
          telefono: String(clienteNuevoRaw.telefono),
        }
      : undefined;

  const resultado = await registrarPedidoCompartido({
    adminUsuarioId,
    clienteId,
    clienteNuevo,
    items,
    modoAnticipo: datos.modoAnticipo === "MONTO_FIJO" ? "MONTO_FIJO" : "PORCENTAJE",
    porcentajeAnticipo: Number(datos.porcentajeAnticipo),
    montoAnticipoFijo: Number(datos.montoAnticipoFijo),
    fechaPrometidaInput: datos.fechaPrometidaInput ? String(datos.fechaPrometidaInput) : "",
    notas: datos.notas ? String(datos.notas).trim() || null : null,
    idPedido: datos.idPedido ? String(datos.idPedido) : undefined,
    idIngreso: datos.idIngreso ? String(datos.idIngreso) : undefined,
    codigo: datos.codigo ? String(datos.codigo) : undefined,
    fecha: fechaValidaOUndefined(datos.fecha),
    sincronizadoOffline: Boolean(datos.sincronizadoOffline),
  });

  if (resultado.error) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  revalidatePath("/admin/pedidos");
  if (clienteId) revalidatePath(`/admin/clientes/${clienteId}`);
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  return NextResponse.json({ ok: true, ...resultado });
}
