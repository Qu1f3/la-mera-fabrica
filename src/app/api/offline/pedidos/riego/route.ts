import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { obtenerAdminUsuario } from "@/lib/supabase/adminUsuario";
import { registrarRiegoCompartido } from "@/lib/pedidos/riego";

export const dynamic = "force-dynamic";

function fechaValidaOUndefined(valor: unknown): Date | undefined {
  if (!valor) return undefined;
  const fecha = new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/** Puerta de entrada ESTABLE para registrar un riego. */
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
  if (!pedidoId) {
    return NextResponse.json({ error: "Falta el pedido." }, { status: 400 });
  }

  const resultado = await registrarRiegoCompartido({
    pedidoId,
    adminUsuarioId,
    observacion: datos.observacion ? String(datos.observacion).trim() || null : null,
    idRiego: datos.idRiego ? String(datos.idRiego) : undefined,
    fecha: fechaValidaOUndefined(datos.fecha),
    sincronizadoOffline: Boolean(datos.sincronizadoOffline),
  });

  if (resultado.error) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  return NextResponse.json({ ok: true, ...resultado });
}
