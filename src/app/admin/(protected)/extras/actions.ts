"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { registrarPagoExtraCompartido } from "@/lib/extras/registrar";

export type TipoPagoExtraFormState = { error?: string };

export async function crearTipoPagoExtra(
  _prevState: TipoPagoExtraFormState,
  formData: FormData
): Promise<TipoPagoExtraFormState> {
  await requireAdmin();
  const descripcion = String(formData.get("descripcion") || "").trim();
  const montoSugeridoRaw = formData.get("montoSugerido");
  const montoSugerido =
    montoSugeridoRaw && String(montoSugeridoRaw).trim() !== ""
      ? Number(montoSugeridoRaw)
      : null;
  // "Suma" (ej. Cargar Ladrillo) o "Resta" (ej. Prestamo/Adelanto) del pago
  // semanal -- ver comentario en el schema sobre por que el signo se guarda
  // ya aplicado en PagoExtraEmpleado.monto, no aca.
  const signoRaw = String(formData.get("signo") || "SUMA");
  const signo = signoRaw === "RESTA" ? "RESTA" : "SUMA";

  if (!descripcion) return { error: "La descripción es obligatoria." };
  if (montoSugerido !== null && (!Number.isFinite(montoSugerido) || montoSugerido < 0)) {
    return { error: "El monto sugerido no es válido." };
  }

  const tipo = await prisma.tipoPagoExtra.create({ data: { descripcion, montoSugerido, signo } });
  await registrarAuditoria({ accion: "crear", entidad: "TipoPagoExtra", entidadId: tipo.id, detalle: tipo.descripcion });
  revalidatePath("/admin/extras");
  return {};
}

export async function alternarActivoTipoPagoExtra(
  id: string,
  activo: boolean,
  _formData: FormData
) {
  await requireAdmin();
  const tipo = await prisma.tipoPagoExtra.update({ where: { id }, data: { activo } });
  await registrarAuditoria({
    accion: activo ? "activar" : "desactivar",
    entidad: "TipoPagoExtra",
    entidadId: id,
    detalle: tipo.descripcion,
  });
  revalidatePath("/admin/extras");
}

export type PagoExtraFormState = { error?: string };

/**
 * Server Action original -- ya NO la usa el formulario (ver
 * NuevoPagoExtraForm.tsx: ahora pasa por POST /api/offline/extras para que
 * funcione igual con o sin conexión, ver propuesta-modo-offline.md). Se
 * deja funcionando, delegando a la misma lógica compartida
 * (src/lib/extras/registrar.ts) que usa esa ruta.
 *
 * A diferencia de la ruta de API (que recibe el monto ya con el signo
 * aplicado, porque el navegador ya lo conoce), esta Server Action todavía
 * resuelve el signo consultando TipoPagoExtra -- es el contrato original,
 * con FormData plano, y se mantiene tal cual.
 */
export async function registrarPagoExtra(
  _prevState: PagoExtraFormState,
  formData: FormData
): Promise<PagoExtraFormState> {
  await requireAdmin();

  const empleadoId = String(formData.get("empleadoId") || "").trim();
  const tipoPagoExtraId = String(formData.get("tipoPagoExtraId") || "").trim() || null;
  const descripcion = String(formData.get("descripcion") || "").trim();
  const montoIngresado = Number(formData.get("monto"));
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!Number.isFinite(montoIngresado) || montoIngresado < 0) {
    return { error: "El monto no es válido." };
  }

  let monto = montoIngresado;
  if (tipoPagoExtraId) {
    const tipo = await prisma.tipoPagoExtra.findUnique({
      where: { id: tipoPagoExtraId },
      select: { signo: true },
    });
    if (tipo?.signo === "RESTA") monto = -montoIngresado;
  }

  const resultado = await registrarPagoExtraCompartido({
    empleadoId,
    tipoPagoExtraId,
    descripcion,
    monto,
    notas,
  });
  if (resultado.error) return { error: resultado.error };

  revalidatePath("/admin/extras");
  revalidatePath("/admin/pagos-semanales");
  return {};
}

export async function eliminarPagoExtra(id: string, _formData: FormData) {
  await requireAdmin();
  const pago = await prisma.pagoExtraEmpleado.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "PagoExtraEmpleado", entidadId: id, detalle: `${pago.descripcion} (L. ${pago.monto})` });
  revalidatePath("/admin/extras");
}
