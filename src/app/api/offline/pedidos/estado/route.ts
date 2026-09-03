import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { obtenerAdminUsuario } from "@/lib/supabase/adminUsuario";
import { cambiarEstadoPedidoCompartido } from "@/lib/pedidos/estado";
import type { EstadoPedido } from "@/lib/types";

export const dynamic = "force-dynamic";

function fechaValidaOUndefined(valor: unknown): Date | undefined {
  if (!valor) return undefined;
  const fecha = new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/**
 * Puerta de entrada ESTABLE para cambiar el estado de un pedido.
 *
 * A diferencia de las demás rutas de /api/offline, esta SÍ puede
 * devolver un conflicto real (409) -- ver
 * src/lib/pedidos/estado.ts y propuesta-modo-offline.md, Fase 4, "qué pasa
 * si dos dispositivos sin conexión editan el mismo pedido": el estado de
 * un pedido SÍ se puede editar desde dos dispositivos distintos (a
 * diferencia de un RegistroProduccion o un movimiento de inventario, que
 * solo se crean, nunca se editan), así que acá sí hace falta detectar el
 * choque y avisar en vez de aplicar a ciegas el último que llegue.
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

  const pedidoId = String(datos.pedidoId || "").trim();
  const estado = String(datos.estado || "") as EstadoPedido;
  if (!pedidoId || !estado) {
    return NextResponse.json({ error: "Faltan datos del pedido o del estado." }, { status: 400 });
  }

  const resultado = await cambiarEstadoPedidoCompartido({
    pedidoId,
    estado,
    notas: datos.notas ? String(datos.notas).trim() || null : null,
    adminUsuarioId,
    idHistorial: datos.idHistorial ? String(datos.idHistorial) : undefined,
    versionEsperada: datos.versionEsperada ? String(datos.versionEsperada) : undefined,
    forzar: Boolean(datos.forzar),
    fecha: fechaValidaOUndefined(datos.fecha),
    sincronizadoOffline: Boolean(datos.sincronizadoOffline),
  });

  if (resultado.conflicto) {
    return NextResponse.json({ conflicto: true, servidorActual: resultado.conflicto }, { status: 409 });
  }
  if (resultado.error) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  return NextResponse.json({ ok: true, ...resultado });
}
