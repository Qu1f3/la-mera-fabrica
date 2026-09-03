"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fechaDesdeInputHonduras } from "@/lib/fecha";
import { registrarAuditoria } from "@/lib/auditoria";
import { registrarMovimientoCompartido } from "@/lib/inventario/registrar";

export type MaterialFormState = { error?: string; ok?: boolean };

/**
 * La cantidad actual de un material NUNCA se edita a mano -- solo cambia
 * registrando movimientos (entrada/salida). Así queda un historial completo
 * de por qué el stock subió o bajó, en vez de un número que cualquiera
 * puede pisar sin dejar rastro.
 */
export async function crearMaterial(
  _prevState: MaterialFormState,
  formData: FormData
): Promise<MaterialFormState> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") || "").trim();
  const unidadMedida = String(formData.get("unidadMedida") || "").trim();
  const cantidadPorUnidad = Number(formData.get("cantidadPorUnidad") || 1);
  const cantidadMinima = Number(formData.get("cantidadMinima") || 0);
  const proveedorId = String(formData.get("proveedorId") || "").trim() || null;
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!unidadMedida) return { error: "La unidad de medida es obligatoria." };
  if (!Number.isFinite(cantidadPorUnidad) || cantidadPorUnidad <= 0) {
    return { error: "La cantidad por unidad debe ser mayor a 0." };
  }
  if (!Number.isFinite(cantidadMinima) || cantidadMinima < 0) {
    return { error: "La cantidad mínima no es válida." };
  }

  // El costo NO se pide acá -- se preguntaría dos veces (una al crear el
  // material y otra al registrar la primera entrada). Empieza en null y se
  // sincroniza solo desde registrarMovimiento con el costo de la última
  // entrada, igual que cantidadActual solo cambia por movimiento.
  const material = await prisma.materialInventario.create({
    data: {
      nombre,
      unidadMedida,
      cantidadPorUnidad,
      cantidadMinima,
      proveedorId,
      notas,
    },
  });
  await registrarAuditoria({ accion: "crear", entidad: "MaterialInventario", entidadId: material.id, detalle: material.nombre });

  // No redirige: el modal de "Nuevo material" se queda en /admin/inventario,
  // revalida la data y el formulario le avisa al usuario (ok:true) para
  // cerrarse solo y mostrar un toast, sin recargar la pagina.
  revalidatePath("/admin/inventario");
  return { ok: true };
}

export async function actualizarMaterial(
  id: string,
  _prevState: MaterialFormState,
  formData: FormData
): Promise<MaterialFormState> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") || "").trim();
  const unidadMedida = String(formData.get("unidadMedida") || "").trim();
  const cantidadPorUnidad = Number(formData.get("cantidadPorUnidad") || 1);
  const cantidadMinima = Number(formData.get("cantidadMinima") || 0);
  const proveedorId = String(formData.get("proveedorId") || "").trim() || null;
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!unidadMedida) return { error: "La unidad de medida es obligatoria." };
  if (!Number.isFinite(cantidadPorUnidad) || cantidadPorUnidad <= 0) {
    return { error: "La cantidad por unidad debe ser mayor a 0." };
  }
  if (!Number.isFinite(cantidadMinima) || cantidadMinima < 0) {
    return { error: "La cantidad mínima no es válida." };
  }

  // El costo no se edita acá -- ver nota en crearMaterial. Se muestra en la
  // ficha como dato de solo lectura, sincronizado desde registrarMovimiento.
  await prisma.materialInventario.update({
    where: { id },
    data: {
      nombre,
      unidadMedida,
      cantidadPorUnidad,
      cantidadMinima,
      proveedorId,
      notas,
    },
  });
  await registrarAuditoria({ accion: "editar", entidad: "MaterialInventario", entidadId: id, detalle: nombre });

  revalidatePath("/admin/inventario");
  revalidatePath(`/admin/inventario/${id}`);
  return {};
}

export async function alternarActivoMaterial(
  id: string,
  activo: boolean,
  _formData: FormData
) {
  await requireAdmin();
  const material = await prisma.materialInventario.update({ where: { id }, data: { activo } });
  await registrarAuditoria({
    accion: activo ? "activar" : "desactivar",
    entidad: "MaterialInventario",
    entidadId: id,
    detalle: material.nombre,
  });
  revalidatePath("/admin/inventario");
  revalidatePath(`/admin/inventario/${id}`);
}

export async function eliminarMaterial(id: string, _formData: FormData) {
  await requireAdmin();

  const totalMovimientos = await prisma.movimientoInventario.count({
    where: { materialId: id },
  });
  if (totalMovimientos > 0) {
    throw new Error(
      `No se puede borrar: este material tiene ${totalMovimientos} movimiento(s) registrado(s). Desactívalo en vez de borrarlo.`
    );
  }

  const material = await prisma.materialInventario.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "MaterialInventario", entidadId: id, detalle: material.nombre });
  revalidatePath("/admin/inventario");
  redirect("/admin/inventario");
}

export type MovimientoFormState = { error?: string; ok?: boolean };

/**
 * Registra una entrada o salida de inventario para un material y ajusta su
 * cantidadActual en la misma transacción. Si es una entrada que además es
 * una compra a un proveedor, también crea el registro de Compra vinculado
 * (una compra = un movimiento, por ahora -- no se manejan compras con
 * varios materiales en un mismo recibo).
 *
 * Las salidas no pueden dejar el stock en negativo: se valida contra la
 * cantidadActual antes de guardar.
 */
export async function registrarMovimiento(
  _prevState: MovimientoFormState,
  formData: FormData
): Promise<MovimientoFormState> {
  await requireAdmin();

  const materialId = String(formData.get("materialId") || "").trim();
  const tipo = String(formData.get("tipo") || "").trim();
  const cantidad = Number(formData.get("cantidad"));
  const costoRaw = formData.get("costo");
  const costo = costoRaw && String(costoRaw).trim() ? Number(costoRaw) : null;
  const notas = String(formData.get("notas") || "").trim() || null;
  const esCompra = formData.get("esCompra") === "on";
  const proveedorId = String(formData.get("proveedorId") || "").trim();
  const esCredito = formData.get("esCredito") === "on";

  if (tipo !== "ENTRADA" && tipo !== "SALIDA") {
    return { error: "Selecciona si es una entrada o una salida." };
  }

  const resultado = await registrarMovimientoCompartido({
    materialId,
    tipo,
    cantidad,
    costo,
    notas,
    esCompra,
    proveedorId,
    esCredito,
  });

  if (resultado.error) return { error: resultado.error };

  revalidatePath("/admin/inventario");
  revalidatePath(`/admin/inventario/${materialId}`);
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  return { ok: true };
}

export async function eliminarMovimiento(id: string, _formData: FormData) {
  await requireAdmin();

  const movimiento = await prisma.movimientoInventario.findUnique({
    where: { id },
  });
  if (!movimiento) return;

  const material = await prisma.materialInventario.findUnique({
    where: { id: movimiento.materialId },
  });
  if (!material) return;

  // Revertir el efecto que tuvo este movimiento sobre el stock, usando el
  // factor de conversión GUARDADO en el movimiento (no el actual del
  // material, que pudo haber cambiado desde entonces).
  const cantidadEnUnidadBase =
    Number(movimiento.cantidad) * Number(movimiento.cantidadPorUnidad);
  const reversion =
    movimiento.tipo === "ENTRADA" ? -cantidadEnUnidadBase : cantidadEnUnidadBase;
  const cantidadResultante = Number(material.cantidadActual) + reversion;

  if (cantidadResultante < 0) {
    throw new Error(
      "No se puede borrar: dejaría el stock en negativo (ya se consumió parte de esa entrada). Ajusta con un nuevo movimiento en vez de borrar este."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.movimientoInventario.delete({ where: { id } });
    await tx.materialInventario.update({
      where: { id: movimiento.materialId },
      data: { cantidadActual: { increment: reversion } },
    });

    if (movimiento.compraId) {
      const restantes = await tx.movimientoInventario.count({
        where: { compraId: movimiento.compraId },
      });
      if (restantes === 0) {
        // El gasto automático de esta compra tampoco se sostiene sin ella.
        await tx.gasto.deleteMany({ where: { compraId: movimiento.compraId } });
        await tx.compra.delete({ where: { id: movimiento.compraId } });
      }
    }
  });

  await registrarAuditoria({
    accion: "eliminar",
    entidad: "MovimientoInventario",
    entidadId: id,
    detalle: `${movimiento.tipo} de ${material.nombre} (${movimiento.cantidad.toString()})`,
  });

  revalidatePath("/admin/inventario");
  revalidatePath(`/admin/inventario/${movimiento.materialId}`);
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
}

export type MarcarCompraPagadaFormState = { error?: string };

/**
 * Marca como pagada una compra que se había registrado "a crédito" y recién
 * ahora crea su Gasto automático (fechado el día que se marca pagada, no el
 * día que llegó el material -- Finanzas siempre refleja cuándo sale la
 * plata de verdad). Si la compra ya estaba pagada, no hace nada raro: el
 * `where: { pagada: false }` de abajo hace que un doble clic no duplique el
 * Gasto.
 */
export async function marcarCompraPagada(
  compraId: string,
  _prevState: MarcarCompraPagadaFormState,
  formData: FormData
): Promise<MarcarCompraPagadaFormState> {
  await requireAdmin();

  const fechaPago = fechaDesdeInputHonduras(formData.get("fechaPago")) ?? new Date();

  const compra = await prisma.compra.findUnique({
    where: { id: compraId },
    include: { proveedor: true, movimientos: { include: { material: true }, take: 1 } },
  });
  if (!compra) return { error: "Esa compra ya no existe." };
  if (compra.pagada) return {};

  const material = compra.movimientos[0]?.material;

  await prisma.$transaction(async (tx) => {
    await tx.compra.update({
      where: { id: compraId, pagada: false },
      data: { pagada: true, fechaPago },
    });

    await tx.gasto.create({
      data: {
        categoria: "MATERIALES",
        monto: compra.montoTotal,
        fecha: fechaPago,
        compraId: compra.id,
        descripcion: `Compra${material ? ` de ${material.nombre}` : ""} a ${compra.proveedor.nombre} (pagada a crédito)`,
      },
    });
  });

  await registrarAuditoria({
    accion: "marcar_pagada",
    entidad: "Compra",
    entidadId: compraId,
    detalle: `L. ${compra.montoTotal.toString()} a ${compra.proveedor.nombre}`,
  });

  revalidatePath("/admin/inventario");
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin/reportes");
  return {};
}

export type ProveedorFormState = { error?: string };

export async function crearProveedor(
  _prevState: ProveedorFormState,
  formData: FormData
): Promise<ProveedorFormState> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim() || null;
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio." };

  const proveedor = await prisma.proveedor.create({
    data: { nombre, telefono, notas },
  });
  await registrarAuditoria({ accion: "crear", entidad: "Proveedor", entidadId: proveedor.id, detalle: proveedor.nombre });

  revalidatePath("/admin/inventario/proveedores");
  redirect(`/admin/inventario/proveedores/${proveedor.id}`);
}

export async function actualizarProveedor(
  id: string,
  _prevState: ProveedorFormState,
  formData: FormData
): Promise<ProveedorFormState> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim() || null;
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio." };

  await prisma.proveedor.update({
    where: { id },
    data: { nombre, telefono, notas },
  });
  await registrarAuditoria({ accion: "editar", entidad: "Proveedor", entidadId: id, detalle: nombre });

  revalidatePath("/admin/inventario/proveedores");
  revalidatePath(`/admin/inventario/proveedores/${id}`);
  return {};
}

export async function alternarActivoProveedor(
  id: string,
  activo: boolean,
  _formData: FormData
) {
  await requireAdmin();
  const proveedor = await prisma.proveedor.update({ where: { id }, data: { activo } });
  await registrarAuditoria({
    accion: activo ? "activar" : "desactivar",
    entidad: "Proveedor",
    entidadId: id,
    detalle: proveedor.nombre,
  });
  revalidatePath("/admin/inventario/proveedores");
  revalidatePath(`/admin/inventario/proveedores/${id}`);
}

export async function eliminarProveedor(id: string, _formData: FormData) {
  await requireAdmin();

  const [materiales, compras] = await Promise.all([
    prisma.materialInventario.count({ where: { proveedorId: id } }),
    prisma.compra.count({ where: { proveedorId: id } }),
  ]);
  const total = materiales + compras;

  if (total > 0) {
    throw new Error(
      `No se puede borrar: este proveedor tiene ${total} registro(s) de materiales/compras. Desactívalo en vez de borrarlo.`
    );
  }

  const proveedor = await prisma.proveedor.delete({ where: { id } });
  await registrarAuditoria({ accion: "eliminar", entidad: "Proveedor", entidadId: id, detalle: proveedor.nombre });
  revalidatePath("/admin/inventario/proveedores");
  redirect("/admin/inventario/proveedores");
}
