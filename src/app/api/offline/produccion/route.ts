import "server-only";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { registrarProduccionCompartido } from "@/lib/produccion/registrar";

// Nunca se debe cachear ni pre-renderizar -- cada llamado escribe en la base.
export const dynamic = "force-dynamic";

function fechaValidaOUndefined(valor: unknown): Date | undefined {
  if (!valor) return undefined;
  const fecha = new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/**
 * Puerta de entrada ESTABLE para registrar producción/mezcla -- a
 * diferencia de una Server Action, el identificador de esta ruta no cambia
 * en cada `git push`/despliegue de Vercel. Eso importa acá porque
 * NuevoRegistroProduccionForm.tsx la usa tanto con conexión como para
 * sincronizar lo que quedó guardado en la cola local de un dispositivo
 * mientras estuvo sin señal (a veces horas después, ya con otra versión
 * del sitio desplegada). Ver propuesta-modo-offline.md, punto 4.
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

  const resultado = await registrarProduccionCompartido({
    empleadoId: String(datos.empleadoId || "").trim(),
    productoId: String(datos.productoId || "").trim(),
    cantidadProducida: Number(datos.cantidadProducida),
    unidadesDefectuosas: Number(datos.unidadesDefectuosas || 0),
    notas: datos.notas ? String(datos.notas).trim() || null : null,
    hizoMezcla: Boolean(datos.hizoMezcla),
    montoMezcla: Number(datos.montoMezcla),
    idRegistro: datos.idRegistro ? String(datos.idRegistro) : undefined,
    idMezcla: datos.idMezcla ? String(datos.idMezcla) : undefined,
    fecha: fechaValidaOUndefined(datos.fecha),
    sincronizadoOffline: Boolean(datos.sincronizadoOffline),
  });

  if (resultado.error) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...resultado });
}
