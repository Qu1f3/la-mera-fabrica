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

  await prisma.$transaction(async (tx) => {
    const pago = await tx.pagoEmpleado.update({
      where: { id },
      data: { estado: "PAGADO", montoPagado, fechaPago },
      include: { empleado: true },
    });

    // Gasto automático: un pago semanal marcado como pagado ES un gasto de
    // planilla. upsert por pagoEmpleadoId -- si se vuelve a marcar pagado
    // (ej: se corrigió el monto) se actualiza en vez de duplicarse.
    await tx.gasto.upsert({
      where: { pagoEmpleadoId: id },
      create: {
        categoria: "EMPLEADOS",
        monto: montoPagado,
        fecha: fechaPago,
        pagoEmpleadoId: id,
        descripcion: `Pago semanal de ${pago.empleado.nombre}`,
      },
      update: { monto: montoPagado, fecha: fechaPago },
    });
  });

  revalidatePath("/admin/pagos-semanales");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  return {};
}

export async function marcarPagoSemanalPendiente(id: string, _formData: FormData) {
  await requireAdmin();
  await prisma.$transaction([
    prisma.pagoEmpleado.update({
      where: { id },
      data: { estado: "PENDIENTE", montoPagado: null, fechaPago: null },
    }),
    // Si se revierte el pago, el gasto tampoco se sostiene -- el dinero no
    // salió de verdad. deleteMany (no delete) porque puede que nunca se
    // haya generado (si el pago nunca pasó por PAGADO).
    prisma.gasto.deleteMany({ where: { pagoEmpleadoId: id } }),
  ]);
  revalidatePath("/admin/pagos-semanales");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
}

export async function eliminarPagoSemanal(id: string, _formData: FormData) {
  await requireAdmin();
  // Sin onDelete: Cascade en el schema -- se borra a mano el gasto ligado
  // antes que el pago, mismo criterio que eliminarMovimiento con su Compra
  // huérfana en inventario/actions.ts.
  await prisma.$transaction([
    prisma.gasto.deleteMany({ where: { pagoEmpleadoId: id } }),
    prisma.pagoEmpleado.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/pagos-semanales");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
}
