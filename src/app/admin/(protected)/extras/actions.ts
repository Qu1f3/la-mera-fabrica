"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

  await prisma.tipoPagoExtra.create({ data: { descripcion, montoSugerido, signo } });
  revalidatePath("/admin/extras");
  return {};
}

export async function alternarActivoTipoPagoExtra(
  id: string,
  activo: boolean,
  _formData: FormData
) {
  await requireAdmin();
  await prisma.tipoPagoExtra.update({ where: { id }, data: { activo } });
  revalidatePath("/admin/extras");
}

export type PagoExtraFormState = { error?: string };

/**
 * Registra un pago extra para un empleado. La descripción y el monto se
 * copian tal cual vengan del formulario (no se leen "en vivo" de
 * TipoPagoExtra después) -- así, si el tipo se edita o desactiva más
 * adelante, los pagos ya registrados no cambian.
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

  if (!empleadoId) return { error: "Selecciona un empleado." };
  if (!descripcion) return { error: "La descripción es obligatoria." };
  if (!Number.isFinite(montoIngresado) || montoIngresado < 0) {
    return { error: "El monto no es válido." };
  }

  // El usuario siempre escribe el monto en positivo ("250"); si el tipo
  // elegido resta del pago semanal (ej. "Prestamo"), se guarda en negativo
  // para que la suma de Pagos semanales (Prisma _sum sobre monto) lo reste
  // solo, sin tener que tocar ese calculo. "Otro" (sin tipo) siempre suma.
  let monto = montoIngresado;
  if (tipoPagoExtraId) {
    const tipo = await prisma.tipoPagoExtra.findUnique({
      where: { id: tipoPagoExtraId },
      select: { signo: true },
    });
    if (tipo?.signo === "RESTA") monto = -montoIngresado;
  }

  await prisma.pagoExtraEmpleado.create({
    data: { empleadoId, tipoPagoExtraId, descripcion, monto, notas },
  });

  revalidatePath("/admin/extras");
  revalidatePath("/admin/pagos-semanales");
  return {};
}

export async function eliminarPagoExtra(id: string, _formData: FormData) {
  await requireAdmin();
  await prisma.pagoExtraEmpleado.delete({ where: { id } });
  revalidatePath("/admin/extras");
}
