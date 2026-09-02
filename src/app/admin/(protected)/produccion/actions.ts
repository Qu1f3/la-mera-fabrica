"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type ProduccionFormState = { error?: string };

/**
 * Registra la producción de un empleado en un producto y/o su mezcla del
 * día. Son dos cosas independientes que comparten un solo formulario porque
 * en la práctica se registran juntas: un empleado puede solo producir, solo
 * hacer mezcla, o ambas el mismo día.
 *
 * El pago unitario se copia de PagoUnitarioProducto al momento del registro
 * (snapshot, igual que el precio de los productos en un pedido) -- si
 * después se cambia la tarifa configurada, los registros ya guardados no se
 * alteran. Lo mismo aplica al monto de mezcla: se guarda el valor que se
 * haya escrito en el formulario, editable cada vez.
 *
 * Las unidades defectuosas se restan de lo que se paga (no se le paga al
 * empleado por piezas que salieron mal), pero se guardan aparte para poder
 * ver el porcentaje de defectos por empleado/producto más adelante.
 */
export async function registrarProduccion(
  _prevState: ProduccionFormState,
  formData: FormData
): Promise<ProduccionFormState> {
  await requireAdmin();

  const empleadoId = String(formData.get("empleadoId") || "").trim();
  const productoId = String(formData.get("productoId") || "").trim();
  const cantidadProducida = Number(formData.get("cantidadProducida"));
  const unidadesDefectuosas = Number(formData.get("unidadesDefectuosas") || 0);
  const notas = String(formData.get("notas") || "").trim() || null;
  const hizoMezcla = formData.get("hizoMezcla") === "on";
  const montoMezcla = Number(formData.get("montoMezcla"));

  if (!empleadoId) return { error: "Selecciona un empleado." };

  const registraProduccion = Boolean(productoId);

  if (!registraProduccion && !hizoMezcla) {
    return { error: "Selecciona un producto o marca que hizo mezcla." };
  }

  let pagoUnitario = 0;
  let totalGanado = 0;

  if (registraProduccion) {
    if (!Number.isInteger(cantidadProducida) || cantidadProducida <= 0) {
      return { error: "La cantidad producida debe ser un número entero mayor a 0." };
    }
    if (!Number.isInteger(unidadesDefectuosas) || unidadesDefectuosas < 0) {
      return { error: "Las unidades defectuosas deben ser un número entero, 0 o más." };
    }
    if (unidadesDefectuosas > cantidadProducida) {
      return { error: "Las unidades defectuosas no pueden ser más que lo producido." };
    }

    const pagoUnitarioProducto = await prisma.pagoUnitarioProducto.findUnique({
      where: { productoId },
    });
    if (!pagoUnitarioProducto) {
      return {
        error:
          "Este producto todavía no tiene un pago unitario configurado. Configúralo primero en \"Pago por unidad\".",
      };
    }

    pagoUnitario = Number(pagoUnitarioProducto.monto);
    const unidadesPagadas = cantidadProducida - unidadesDefectuosas;
    totalGanado = Math.round(unidadesPagadas * pagoUnitario * 100) / 100;
  }

  if (hizoMezcla && (!Number.isFinite(montoMezcla) || montoMezcla <= 0)) {
    return { error: "El monto de mezcla no es válido." };
  }

  const { registroId, mezclaId } = await prisma.$transaction(async (tx) => {
    let registroId: string | null = null;
    let mezclaId: string | null = null;

    if (registraProduccion) {
      const registro = await tx.registroProduccion.create({
        data: {
          empleadoId,
          productoId,
          cantidadProducida,
          unidadesDefectuosas,
          pagoUnitario,
          totalGanado,
          notas,
        },
      });
      registroId = registro.id;
    }
    if (hizoMezcla) {
      const mezcla = await tx.registroMezcla.create({
        data: { empleadoId, monto: montoMezcla, notas },
      });
      mezclaId = mezcla.id;
    }

    return { registroId, mezclaId };
  });

  // Los llamados a registrarAuditoria van DESPUES de que la transaccion ya
  // confirmo -- adentro usaria el cliente global de prisma (no `tx`) y
  // ademas llama a Supabase auth por red, lo que dejaria la transaccion
  // interactiva abierta de mas y podria toparse con su timeout.
  if (registroId) {
    await registrarAuditoria({
      accion: "crear",
      entidad: "RegistroProduccion",
      entidadId: registroId,
      detalle: `${cantidadProducida} unidad(es) -- L. ${totalGanado}`,
    });
  }
  if (mezclaId) {
    await registrarAuditoria({
      accion: "crear",
      entidad: "RegistroMezcla",
      entidadId: mezclaId,
      detalle: `L. ${montoMezcla}`,
    });
  }

  revalidatePath("/admin/produccion");
  redirect("/admin/produccion");
}

export async function eliminarRegistroProduccion(id: string, _formData: FormData) {
  await requireAdmin();
  const registro = await prisma.registroProduccion.delete({ where: { id } });
  await registrarAuditoria({
    accion: "eliminar",
    entidad: "RegistroProduccion",
    entidadId: id,
    detalle: `${registro.cantidadProducida} unidad(es) -- L. ${registro.totalGanado}`,
  });
  revalidatePath("/admin/produccion");
}

export async function eliminarRegistroMezcla(id: string, _formData: FormData) {
  await requireAdmin();
  const registro = await prisma.registroMezcla.delete({ where: { id } });
  await registrarAuditoria({
    accion: "eliminar",
    entidad: "RegistroMezcla",
    entidadId: id,
    detalle: `L. ${registro.monto}`,
  });
  revalidatePath("/admin/produccion");
}

export type PagoUnitarioFormState = { error?: string };

/**
 * Crea o actualiza el pago unitario configurado para un producto (upsert).
 * No afecta registros de producción ya guardados -- solo el próximo
 * registro que se haga con este producto.
 */
export async function guardarPagoUnitario(
  _prevState: PagoUnitarioFormState,
  formData: FormData
): Promise<PagoUnitarioFormState> {
  await requireAdmin();

  const productoId = String(formData.get("productoId") || "").trim();
  const monto = Number(formData.get("monto"));

  if (!productoId) return { error: "Falta el producto." };
  if (!Number.isFinite(monto) || monto < 0) {
    return { error: "El monto no es válido." };
  }

  await prisma.pagoUnitarioProducto.upsert({
    where: { productoId },
    create: { productoId, monto },
    update: { monto },
  });
  await registrarAuditoria({ accion: "editar", entidad: "PagoUnitarioProducto", entidadId: productoId, detalle: `L. ${monto}` });

  revalidatePath("/admin/produccion/pago-unitario");
  revalidatePath("/admin/produccion");
  return {};
}
