"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type PagoSemanalFormState = { error?: string };

function fechaDesdeInput(valor: FormDataEntryValue | null): Date | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const fecha = new Date(`${texto}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Genera (o regenera) el pago semanal de un empleado sumando sus registros
 * de producción, mezcla y extras dentro del rango de fechas indicado.
 * Vuelve a calcular los totales si ya existe un pago para esa
 * semana/empleado (@@unique([empleadoId, semanaInicio]) en el schema) --
 * útil si se cargó un registro tarde y hay que actualizar el total antes de
 * pagar.
 */
export async function generarPagoSemanal(
  _prevState: PagoSemanalFormState,
  formData: FormData
): Promise<PagoSemanalFormState> {
  await requireAdmin();

  const empleadoId = String(formData.get("empleadoId") || "").trim();
  const semanaInicio = fechaDesdeInput(formData.get("semanaInicio"));
  const semanaFin = fechaDesdeInput(formData.get("semanaFin"));

  if (!empleadoId) return { error: "Selecciona un empleado." };
  if (!semanaInicio || !semanaFin) {
    return { error: "Indica el inicio y el fin de la semana." };
  }
  if (semanaFin < semanaInicio) {
    return { error: "El fin de la semana no puede ser antes que el inicio." };
  }

  // Límite superior exclusivo: el día de "fin" completo, hasta la medianoche
  // siguiente.
  const finExclusivo = new Date(semanaFin.getTime() + 24 * 60 * 60 * 1000);
  const rango = { gte: semanaInicio, lt: finExclusivo };

  const [producciones, mezclas, extras] = await Promise.all([
    prisma.registroProduccion.aggregate({
      where: { empleadoId, fecha: rango },
      _sum: { totalGanado: true },
    }),
    prisma.registroMezcla.aggregate({
      where: { empleadoId, fecha: rango },
      _sum: { monto: true },
    }),
    prisma.pagoExtraEmpleado.aggregate({
      where: { empleadoId, fecha: rango },
      _sum: { monto: true },
    }),
  ]);

  const totalProduccion = Number(producciones._sum.totalGanado ?? 0);
  const totalMezcla = Number(mezclas._sum.monto ?? 0);
  const totalExtras = Number(extras._sum.monto ?? 0);
  const totalGanado =
    Math.round((totalProduccion + totalMezcla + totalExtras) * 100) / 100;

  await prisma.pagoEmpleado.upsert({
    where: { empleadoId_semanaInicio: { empleadoId, semanaInicio } },
    create: {
      empleadoId,
      semanaInicio,
      semanaFin,
      totalProduccion,
      totalMezcla,
      totalExtras,
      totalGanado,
    },
    update: {
      semanaFin,
      totalProduccion,
      totalMezcla,
      totalExtras,
      totalGanado,
    },
  });

  revalidatePath("/admin/pagos-semanales");
  return {};
}

export type MarcarPagadoFormState = { error?: string };

export async function marcarPagoSemanalPagado(
  id: string,
  _prevState: MarcarPagadoFormState,
  formData: FormData
): Promise<MarcarPagadoFormState> {
  await requireAdmin();

  const montoPagado = Number(formData.get("montoPagado"));
  const fechaPago = fechaDesdeInput(formData.get("fechaPago")) ?? new Date();

  if (!Number.isFinite(montoPagado) || montoPagado < 0) {
    return { error: "El monto pagado no es válido." };
  }

  await prisma.pagoEmpleado.update({
    where: { id },
    data: { estado: "PAGADO", montoPagado, fechaPago },
  });

  revalidatePath("/admin/pagos-semanales");
  return {};
}

export async function marcarPagoSemanalPendiente(id: string, _formData: FormData) {
  await requireAdmin();
  await prisma.pagoEmpleado.update({
    where: { id },
    data: { estado: "PENDIENTE", montoPagado: null, fechaPago: null },
  });
  revalidatePath("/admin/pagos-semanales");
}

export async function eliminarPagoSemanal(id: string, _formData: FormData) {
  await requireAdmin();
  await prisma.pagoEmpleado.delete({ where: { id } });
  revalidatePath("/admin/pagos-semanales");
}
