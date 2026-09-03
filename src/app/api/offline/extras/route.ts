import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { registrarPagoExtraCompartido } from "@/lib/extras/registrar";

export const dynamic = "force-dynamic";

function fechaValidaOUndefined(valor: unknown): Date | undefined {
  if (!valor) return undefined;
  const fecha = new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/**
 * Puerta de entrada ESTABLE para registrar un pago extra -- mismo criterio
 * que /api/offline/produccion. Ver propuesta-modo-offline.md.
 *
 * El `monto` que llega acá ya viene con el signo aplicado (negativo si el
 * tipo elegido resta) -- lo resuelve el formulario en el navegador, que ya
 * tiene esa información (ver src/lib/extras/registrar.ts).
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

  const resultado = await registrarPagoExtraCompartido({
    empleadoId: String(datos.empleadoId || "").trim(),
    tipoPagoExtraId: datos.tipoPagoExtraId ? String(datos.tipoPagoExtraId) : null,
    descripcion: String(datos.descripcion || "").trim(),
    monto: Number(datos.monto),
    notas: datos.notas ? String(datos.notas).trim() || null : null,
    id: datos.id ? String(datos.id) : undefined,
    fecha: fechaValidaOUndefined(datos.fecha),
    sincronizadoOffline: Boolean(datos.sincronizadoOffline),
  });

  if (resultado.error) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  revalidatePath("/admin/extras");
  revalidatePath("/admin/pagos-semanales");
  return NextResponse.json({ ok: true, id: resultado.id });
}
