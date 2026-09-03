import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { asignarFechaPrometidaCompartido } from "@/lib/pedidos/fecha";

export const dynamic = "force-dynamic";

/**
 * Puerta de entrada ESTABLE para asignar la fecha prometida de un pedido.
 * Mismo mecanismo de conflicto (409) que /api/offline/pedidos/estado -- ver
 * src/lib/pedidos/fecha.ts.
 */
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

  const resultado = await asignarFechaPrometidaCompartido({
    pedidoId,
    fechaPrometidaInput: String(datos.fechaPrometidaInput || ""),
    versionEsperada: datos.versionEsperada ? String(datos.versionEsperada) : undefined,
    forzar: Boolean(datos.forzar),
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
  return NextResponse.json({ ok: true });
}
