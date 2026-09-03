"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fechaDesdeInputHonduras, formatearFechaHonduras } from "@/lib/fecha";
import { registrarAuditoria } from "@/lib/auditoria";

export type PagoSemanalFormState = { error?: string };

/**
 * Genera (o regenera) el pago semanal de un empleado sumando sus registros
 * de producción, mezcla y extras dentro del rango de fechas indicado.
 * Vuelve a calcular los totales si ya existe un pago para esa
 * semana/empleado (@@unique([empleadoId, semanaInicio]) en el schema) --
 * útil si se cargó un registro tarde y hay que actualizar el total antes de
 * pagar.
 *
 * Excluye los días que ya se pagaron en OTRO pago de este mismo empleado --
 * caso real (usuario, 2026-09-03): un empleado cobra un día suelto (ej.
 * miércoles) y ese pago se marca PAGADO; días después se genera el pago de
 * la semana completa (lunes a sábado), que por rango de fechas volvería a
 * sumar la producción del miércoles -- pagándola dos veces. Acá se busca
 * cualquier OTRO PagoEmpleado (id distinto) de este empleado que ya esté
 * PAGADO y cuyo rango se cruce con el que se está generando, y esos días se
 * restan de la suma antes de calcular el total. Aplica sin importar el
 * orden en que se generaron los pagos (el día suelto puede haberse pagado
 * antes o después de la semana completa).
 */
export async function generarPagoSemanal(
  _prevState: PagoSemanalFormState,
  formData: FormData
): Promise<PagoSemanalFormState> {
  await requireAdmin();

  const empleadoId = String(formData.get("empleadoId") || "").trim();
  const semanaInicio = fechaDesdeInputHonduras(formData.get("semanaInicio"));
  const semanaFin = fechaDesdeInputHonduras(formData.get("semanaFin"));

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

  // Si ya existe un pago para este empleado/semana exacta, se excluye a sí
  // mismo de la búsqueda de "otros pagos ya pagados" de abajo -- si no, un
  // pago que ya está PAGADO se compararía contra sí mismo al recalcularse
  // (ej. se cargó un registro tarde) y su propio total se restaría de sí
  // mismo, dando siempre L. 0.
  const pagoExistente = await prisma.pagoEmpleado.findUnique({
    where: { empleadoId_semanaInicio: { empleadoId, semanaInicio } },
    select: { id: true },
  });

  const otrosPagados = await prisma.pagoEmpleado.findMany({
    where: {
      empleadoId,
      estado: "PAGADO",
      id: pagoExistente ? { not: pagoExistente.id } : undefined,
      // Se cruzan si el otro empieza antes de que termine este, y termina
      // despues de que este empieza (mismo criterio de "rango" que arriba).
      semanaInicio: { lt: finExclusivo },
      semanaFin: { gte: semanaInicio },
    },
    orderBy: { semanaInicio: "asc" },
  });

  // Para cada pago ya pagado que se cruza, la franja [gte, lt) recortada a
  // la parte que cae DENTRO del rango que se está generando ahora -- es la
  // parte que hay que restar, no el rango completo del otro pago (podria
  // sobresalir de los limites de este).
  const franjasYaPagadas = otrosPagados.map((otro) => {
    const otroFinExclusivo = new Date(otro.semanaFin.getTime() + 24 * 60 * 60 * 1000);
    return {
      gte: otro.semanaInicio > semanaInicio ? otro.semanaInicio : semanaInicio,
      lt: otroFinExclusivo < finExclusivo ? otroFinExclusivo : finExclusivo,
    };
  });

  const filtroExcluido =
    franjasYaPagadas.length > 0
      ? { OR: franjasYaPagadas.map((f) => ({ fecha: { gte: f.gte, lt: f.lt } })) }
      : null;

  const filtroFecha = filtroExcluido
    ? { AND: [{ fecha: rango }, { NOT: filtroExcluido }] }
    : { fecha: rango };

  const [producciones, mezclas, extras] = await Promise.all([
    prisma.registroProduccion.aggregate({
      where: { empleadoId, ...filtroFecha },
      _sum: { totalGanado: true },
    }),
    prisma.registroMezcla.aggregate({
      where: { empleadoId, ...filtroFecha },
      _sum: { monto: true },
    }),
    prisma.pagoExtraEmpleado.aggregate({
      where: { empleadoId, ...filtroFecha },
      _sum: { monto: true },
    }),
  ]);

  const totalProduccion = Number(producciones._sum.totalGanado ?? 0);
  const totalMezcla = Number(mezclas._sum.monto ?? 0);
  const totalExtras = Number(extras._sum.monto ?? 0);
  const totalGanado =
    Math.round((totalProduccion + totalMezcla + totalExtras) * 100) / 100;

  // Nota automática explicando por qué el total no es la suma "cruda" del
  // rango -- este campo lo genera y sobreescribe SOLO esta acción (no hay
  // ningún formulario que deje escribir notas de pago semanal a mano hoy).
  // Si ya no hay nada que excluir (ej. se desmarcó como pagado el otro
  // pago), queda en null -- no se arrastra una nota vieja que ya no aplica.
  let notaAutomatica: string | null = null;
  if (filtroExcluido) {
    const [prodExcluida, mezclaExcluida, extrasExcluidos] = await Promise.all([
      prisma.registroProduccion.aggregate({
        where: { empleadoId, ...filtroExcluido },
        _sum: { totalGanado: true },
      }),
      prisma.registroMezcla.aggregate({
        where: { empleadoId, ...filtroExcluido },
        _sum: { monto: true },
      }),
      prisma.pagoExtraEmpleado.aggregate({
        where: { empleadoId, ...filtroExcluido },
        _sum: { monto: true },
      }),
    ]);
    const montoExcluido =
      Math.round(
        (Number(prodExcluida._sum.totalGanado ?? 0) +
          Number(mezclaExcluida._sum.monto ?? 0) +
          Number(extrasExcluidos._sum.monto ?? 0)) *
          100
      ) / 100;

    const diasTexto = franjasYaPagadas
      .map((f) => {
        const finReal = new Date(f.lt.getTime() - 1);
        const inicioTexto = formatearFechaHonduras(f.gte, { day: "2-digit", month: "2-digit" });
        const finTexto = formatearFechaHonduras(finReal, { day: "2-digit", month: "2-digit" });
        return inicioTexto === finTexto ? inicioTexto : `${inicioTexto}–${finTexto}`;
      })
      .join(", ");

    notaAutomatica = `Ya pagado en otro registro: L. ${montoExcluido.toFixed(2)} (${diasTexto}) -- no incluido en este total.`;
  }

  const pago = await prisma.pagoEmpleado.upsert({
    where: { empleadoId_semanaInicio: { empleadoId, semanaInicio } },
    create: {
      empleadoId,
      semanaInicio,
      semanaFin,
      totalProduccion,
      totalMezcla,
      totalExtras,
      totalGanado,
      notas: notaAutomatica,
    },
    update: {
      semanaFin,
      totalProduccion,
      totalMezcla,
      totalExtras,
      totalGanado,
      notas: notaAutomatica,
    },
  });
  await registrarAuditoria({
    accion: "generar",
    entidad: "PagoEmpleado",
    entidadId: pago.id,
    detalle: notaAutomatica ? `L. ${totalGanado} -- ${notaAutomatica}` : `L. ${totalGanado}`,
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
  const fechaPago = fechaDesdeInputHonduras(formData.get("fechaPago")) ?? new Date();

  if (!Number.isFinite(montoPagado) || montoPagado < 0) {
    return { error: "El monto pagado no es válido." };
  }

  const empleadoNombre = await prisma.$transaction(async (tx) => {
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

    return pago.empleado.nombre;
  });

  await registrarAuditoria({
    accion: "marcar_pagado",
    entidad: "PagoEmpleado",
    entidadId: id,
    detalle: `${empleadoNombre} -- L. ${montoPagado}`,
  });

  revalidatePath("/admin/pagos-semanales");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  return {};
}

export async function marcarPagoSemanalPendiente(id: string, _formData: FormData) {
  await requireAdmin();
  const pagoPrevio = await prisma.pagoEmpleado.findUnique({
    where: { id },
    include: { empleado: true },
  });
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
  await registrarAuditoria({
    accion: "marcar_pendiente",
    entidad: "PagoEmpleado",
    entidadId: id,
    detalle: pagoPrevio?.empleado.nombre,
  });
  revalidatePath("/admin/pagos-semanales");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
}

export async function eliminarPagoSemanal(id: string, _formData: FormData) {
  await requireAdmin();
  const pagoPrevio = await prisma.pagoEmpleado.findUnique({
    where: { id },
    include: { empleado: true },
  });
  // Sin onDelete: Cascade en el schema -- se borra a mano el gasto ligado
  // antes que el pago, mismo criterio que eliminarMovimiento con su Compra
  // huérfana en inventario/actions.ts.
  await prisma.$transaction([
    prisma.gasto.deleteMany({ where: { pagoEmpleadoId: id } }),
    prisma.pagoEmpleado.delete({ where: { id } }),
  ]);
  await registrarAuditoria({
    accion: "eliminar",
    entidad: "PagoEmpleado",
    entidadId: id,
    detalle: pagoPrevio?.empleado.nombre,
  });
  revalidatePath("/admin/pagos-semanales");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
}
