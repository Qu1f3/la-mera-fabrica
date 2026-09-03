import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { crearEntregaCompartido } from "@/lib/pedidos/entrega";

export const dynamic = "force-dynamic";

function fechaValidaOUndefined(valor: unknown): Date | undefined {
  if (!valor) return undefined;
  const fecha = new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/** Puerta de entrada ESTABLE para programar una entrega. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
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

  const resultado = await crearEntregaCompartido({
    pedidoId,
    fechaProgramadaInput: String(datos.fechaProgramadaInput || ""),
    notas: datos.notas ? String(datos.notas).trim() || null : null,
    idEntrega: datos.idEntrega ? String(datos.idEntrega) : undefined,
    fecha: fechaValidaOUndefined(datos.fecha),
    sincronizadoOffline: Boolean(datos.sincronizadoOffline),
  });

  if (resultado.error) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  revalidatePath(`/admin/pedidos/${pedidoId}`);
  revalidatePath("/admin/calendario");
  return NextResponse.json({ ok: true, ...resultado });
}
