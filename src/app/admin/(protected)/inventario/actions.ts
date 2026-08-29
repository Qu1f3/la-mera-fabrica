"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

function fechaDesdeInput(valor: FormDataEntryValue | null): Date | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const fecha = new Date(`${texto}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

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
  await prisma.materialInventario.create({
    data: {
      nombre,
      unidadMedida,
      cantidadPorUnidad,
      cantidadMinima,
      proveedorId,
      notas,
    },
  });

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
  await prisma.materialInventario.update({ where: { id }, data: { activo } });
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
  // "cantidad" está en unidades de compra (ej: bolsas), no en la unidad de
  // medida del material -- se convierte más abajo con cantidadPorUnidad.
  const cantidad = Number(formData.get("cantidad"));
  const costoRaw = formData.get("costo");
  const costo = costoRaw && String(costoRaw).trim() ? Number(costoRaw) : null;
  const notas = String(formData.get("notas") || "").trim() || null;
  const esCompra = formData.get("esCompra") === "on";
  const proveedorId = String(formData.get("proveedorId") || "").trim();
  const esCredito = formData.get("esCredito") === "on";

  if (!materialId) return { error: "Selecciona un material." };
  if (tipo !== "ENTRADA" && tipo !== "SALIDA") {
    return { error: "Selecciona si es una entrada o una salida." };
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { error: "La cantidad debe ser un número mayor a 0." };
  }
  if (costo !== null && (!Number.isFinite(costo) || costo < 0)) {
    return { error: "El costo no es válido." };
  }

  const material = await prisma.materialInventario.findUnique({
    where: { id: materialId },
  });
  if (!material) return { error: "Ese material ya no existe." };

  const cantidadPorUnidad = Number(material.cantidadPorUnidad);
  // Cuánto se suma/resta de verdad al stock (en la unidad de medida del
  // material), no la cantidad de unidades de compra que se escribió.
  const cantidadEnUnidadBase = cantidad * cantidadPorUnidad;

  if (tipo === "SALIDA" && cantidadEnUnidadBase > Number(material.cantidadActual)) {
    return {
      error: `No hay suficiente stock: quedan ${material.cantidadActual.toString()} ${material.unidadMedida}.`,
    };
  }

  if (esCompra) {
    if (tipo !== "ENTRADA") {
      return { error: "Una compra solo aplica a una entrada de inventario." };
    }
    if (!proveedorId) return { error: "Selecciona el proveedor de la compra." };
    if (costo === null || costo <= 0) {
      return { error: "Escribe el costo por unidad para calcular el total de la compra." };
    }
  }

  // El monto total de la compra siempre se calcula acá (cantidad × costo
  // por unidad de compra) -- nunca se recibe como valor aparte del
  // formulario, así no hay dos números que puedan quedar desincronizados.
  const montoTotal = costo !== null ? Math.round(cantidad * costo * 100) / 100 : 0;

  const deltaStock = tipo === "ENTRADA" ? cantidadEnUnidadBase : -cantidadEnUnidadBase;

  await prisma.$transaction(async (tx) => {
    let compraId: string | null = null;
    if (esCompra) {
      const compra = await tx.compra.create({
        data: { proveedorId, montoTotal, notas, pagada: !esCredito },
      });
      compraId = compra.id;

      // Gasto automático: una compra de material ES un gasto, no hace
      // falta volver a escribirlo en Finanzas -- PERO solo si se paga de
      // una vez. Si es a crédito, el Gasto se crea después, cuando se
      // marque la compra como pagada (ver marcarCompraPagada más abajo) --
      // así Finanzas refleja cuándo sale la plata de verdad, no cuándo
      // llegó el material.
      if (!esCredito) {
        const proveedor = await tx.proveedor.findUnique({ where: { id: proveedorId } });
        await tx.gasto.create({
          data: {
            categoria: "MATERIALES",
            monto: montoTotal,
            fecha: compra.fecha,
            compraId: compra.id,
            descripcion: `Compra de ${material.nombre}${proveedor ? ` a ${proveedor.nombre}` : ""}`,
          },
        });
      }
    }

    await tx.movimientoInventario.create({
      data: { materialId, tipo, cantidad, cantidadPorUnidad, costo, compraId, notas },
    });

    await tx.materialInventario.update({
      where: { id: materialId },
      data: {
        cantidadActual: { increment: deltaStock },
        // El "costo" del material siempre refleja la última entrada con
        // costo -- así solo se captura un precio en un solo lugar (acá),
        // nunca por separado al crear/editar el material.
        ...(tipo === "ENTRADA" && costo !== null ? { costo } : {}),
      },
    });
  });

  // Mismo criterio que crearMaterial: sin redirect, para que el modal de
  // "Registrar movimiento" se cierre solo (via el ok:true) en vez de navegar.
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

  const fechaPago = fechaDesdeInput(formData.get("fechaPago")) ?? new Date();

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
  await prisma.proveedor.update({ where: { id }, data: { activo } });
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
