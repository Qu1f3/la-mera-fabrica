import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { registrarMovimientoCompartido } from "@/lib/inventario/registrar";

export const dynamic = "force-dynamic";

function fechaValidaOUndefined(valor: unknown): Date | undefined {
  if (!valor) return undefined;
  const fecha = new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/**
 * Puerta de entrada ESTABLE para registrar un movimiento de inventario --
 * mismo criterio que /api/offline/produccion y /api/offline/extras. Ver
 * propuesta-modo-offline.md.
 *
 * A propósito, esta ruta NO valida que haya stock suficiente en el
 * navegador -- eso solo se puede saber con certeza contra la base real
 * (ver registrarMovimientoCompartido), así que si un movimiento sin
 * conexión termina dejando el stock en negativo, la sincronización de ESE
 * movimiento falla con un error claro y se queda pendiente (visible en el
 * banner de arriba) en vez de aplicarse a la fuerza.
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

  const tipo = String(datos.tipo || "").trim();
  if (tipo !== "ENTRADA" && tipo !== "SALIDA") {
    return NextResponse.json({ error: "Selecciona si es una entrada o una salida." }, { status: 400 });
  }

  const resultado = await registrarMovimientoCompartido({
    materialId: String(datos.materialId || "").trim(),
    tipo,
    cantidad: Number(datos.cantidad),
    costo: datos.costo !== null && datos.costo !== undefined && datos.costo !== "" ? Number(datos.costo) : null,
    notas: datos.notas ? String(datos.notas).trim() || null : null,
    esCompra: Boolean(datos.esCompra),
    proveedorId: String(datos.proveedorId || "").trim(),
    esCredito: Boolean(datos.esCredito),
    idMovimiento: datos.idMovimiento ? String(datos.idMovimiento) : undefined,
    idCompra: datos.idCompra ? String(datos.idCompra) : undefined,
    idGasto: datos.idGasto ? String(datos.idGasto) : undefined,
    fecha: fechaValidaOUndefined(datos.fecha),
    sincronizadoOffline: Boolean(datos.sincronizadoOffline),
  });

  if (resultado.error) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  revalidatePath("/admin/inventario");
  revalidatePath(`/admin/inventario/${datos.materialId}`);
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  return NextResponse.json({ ok: true, ...resultado });
}
