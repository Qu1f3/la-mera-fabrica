"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { registrarProduccionCompartido } from "@/lib/produccion/registrar";

export type ProduccionFormState = { error?: string };

/**
 * Server Action original -- ya NO la usa el formulario (ver
 * NuevoRegistroProduccionForm.tsx: ahora pasa por
 * POST /api/offline/produccion para que funcione igual con o sin conexión,
 * ver propuesta-modo-offline.md). Se deja funcionando, delegando a la
 * misma lógica compartida (src/lib/produccion/registrar.ts) que usa esa
 * ruta, para que no haya dos copias de las reglas de negocio.
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

  const resultado = await registrarProduccionCompartido({
    empleadoId,
    productoId,
    cantidadProducida,
    unidadesDefectuosas,
    notas,
    hizoMezcla,
    montoMezcla,
  });

  if (resultado.error) return { error: resultado.error };

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
