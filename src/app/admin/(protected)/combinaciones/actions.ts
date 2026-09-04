"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type CombinacionFormState = { error?: string };

type ComponenteEntrada = {
  nombre?: unknown;
  cementoCantidad?: unknown;
  cementoUnidad?: unknown;
  cementoTipo?: unknown;
  coloranteColor?: unknown;
  coloranteCantidad?: unknown;
  coloranteUnidad?: unknown;
  notas?: unknown;
};

type ComponenteValidado = {
  orden: number;
  nombre: string;
  cementoCantidad: number | null;
  cementoUnidad: string | null;
  cementoTipo: string | null;
  coloranteColor: string | null;
  coloranteCantidad: number | null;
  coloranteUnidad: string | null;
  notas: string | null;
};

/**
 * Valida y normaliza la lista de componentes que llega como JSON desde el
 * formulario (ver ComponentesEditor.tsx) -- un <form> nativo no tiene una
 * forma limpia de mandar un array de objetos con nombres de campo únicos
 * por fila, así que viaja serializado en un solo campo oculto
 * ("componentesJson") y se vuelve a validar acá server-side (nunca se
 * confía en la validación del navegador para esto).
 *
 * cementoCantidad/coloranteCantidad quedan en null cuando el campo llegó
 * vacío -- significa "sin cantidad exacta" (ej: el cemento base ya es del
 * color de fondo, o "depende del empleado"), no un error.
 */
function validarComponentes(
  json: string
): { error: string } | { componentes: ComponenteValidado[] } {
  let bruto: unknown;
  try {
    bruto = JSON.parse(json);
  } catch {
    return { error: "La lista de componentes no es válida." };
  }
  if (!Array.isArray(bruto) || bruto.length === 0) {
    return { error: 'Agrega al menos un componente (ej: "Fondo Rojo").' };
  }

  const componentes: ComponenteValidado[] = [];
  for (let i = 0; i < bruto.length; i++) {
    const c = (bruto[i] ?? {}) as ComponenteEntrada;
    const numero = i + 1;
    const nombre = String(c.nombre ?? "").trim();
    if (!nombre) {
      return { error: `Componente ${numero}: falta el nombre (ej: "Fondo Rojo").` };
    }

    let cementoCantidad: number | null = null;
    let cementoUnidad: string | null = null;
    // El negocio SOLO trabaja con estos dos tipos de cemento (aclarado por
    // el usuario 2026-09-03) -- cualquier otro valor que llegue (formulario
    // manipulado a mano, dato viejo) cae a "gris" en vez de fallar.
    let cementoTipo: string | null = null;
    const cementoTexto = String(c.cementoCantidad ?? "").trim();
    if (cementoTexto !== "") {
      const valor = Number(cementoTexto);
      if (!Number.isFinite(valor) || valor <= 0) {
        return { error: `Componente ${numero} (${nombre}): la cantidad de cemento no es válida.` };
      }
      cementoCantidad = valor;
      cementoUnidad = String(c.cementoUnidad ?? "").trim() || "kg";
      cementoTipo = String(c.cementoTipo ?? "").trim().toLowerCase() === "blanco" ? "blanco" : "gris";
    }

    const coloranteColor = String(c.coloranteColor ?? "").trim() || null;
    let coloranteCantidad: number | null = null;
    let coloranteUnidad: string | null = null;
    const coloranteTexto = String(c.coloranteCantidad ?? "").trim();
    if (coloranteTexto !== "") {
      const valor = Number(coloranteTexto);
      if (!Number.isFinite(valor) || valor <= 0) {
        return { error: `Componente ${numero} (${nombre}): la cantidad de colorante no es válida.` };
      }
      if (!coloranteColor) {
        return { error: `Componente ${numero} (${nombre}): indica de qué color es el colorante.` };
      }
      coloranteCantidad = valor;
      coloranteUnidad = String(c.coloranteUnidad ?? "").trim() || "lb";
    }

    const notas = String(c.notas ?? "").trim() || null;

    if (!cementoCantidad && !coloranteColor && !notas) {
      return {
        error: `Componente ${numero} (${nombre}): agrega cemento, colorante, o una nota explicando por qué no lleva cantidad.`,
      };
    }

    componentes.push({
      orden: i,
      nombre,
      cementoCantidad,
      cementoUnidad,
      cementoTipo,
      coloranteColor,
      coloranteCantidad,
      coloranteUnidad,
      notas,
    });
  }

  return { componentes };
}

export async function crearCombinacion(
  _prevState: CombinacionFormState,
  formData: FormData
): Promise<CombinacionFormState> {
  await requireAdmin();

  const productoId = String(formData.get("productoId") || "").trim();
  const notas = String(formData.get("notas") || "").trim() || null;
  const componentesJson = String(formData.get("componentesJson") || "[]");

  if (!productoId) return { error: "Selecciona el mosaico." };

  const resultado = validarComponentes(componentesJson);
  if ("error" in resultado) return { error: resultado.error };

  const [producto, existente] = await Promise.all([
    prisma.producto.findUnique({ where: { id: productoId }, select: { nombre: true } }),
    prisma.combinacionMosaico.findUnique({ where: { productoId } }),
  ]);
  if (!producto) return { error: "Ese producto ya no existe." };
  if (existente) {
    return { error: "Este mosaico ya tiene una combinación registrada -- edítala en vez de crear otra." };
  }

  const combinacion = await prisma.combinacionMosaico.create({
    data: {
      productoId,
      notas,
      componentes: { create: resultado.componentes },
    },
  });
  await registrarAuditoria({
    accion: "crear",
    entidad: "CombinacionMosaico",
    entidadId: combinacion.id,
    detalle: producto.nombre,
  });

  revalidatePath("/admin/combinaciones");
  redirect("/admin/combinaciones");
}

export async function actualizarCombinacion(
  id: string,
  _prevState: CombinacionFormState,
  formData: FormData
): Promise<CombinacionFormState> {
  await requireAdmin();

  const notas = String(formData.get("notas") || "").trim() || null;
  const componentesJson = String(formData.get("componentesJson") || "[]");

  const resultado = validarComponentes(componentesJson);
  if ("error" in resultado) return { error: resultado.error };

  const combinacion = await prisma.combinacionMosaico.findUnique({
    where: { id },
    include: { producto: { select: { nombre: true } } },
  });
  if (!combinacion) return { error: "Esta combinación ya no existe." };

  // El producto ligado no se puede cambiar desde acá -- reemplaza toda la
  // lista de componentes (más simple y seguro que intentar hacer un diff
  // fila por fila, y ningún otro modelo apunta a ComponenteCombinacion).
  await prisma.$transaction([
    prisma.componenteCombinacion.deleteMany({ where: { combinacionId: id } }),
    prisma.combinacionMosaico.update({
      where: { id },
      data: {
        notas,
        componentes: { create: resultado.componentes },
      },
    }),
  ]);
  await registrarAuditoria({
    accion: "editar",
    entidad: "CombinacionMosaico",
    entidadId: id,
    detalle: combinacion.producto.nombre,
  });

  revalidatePath("/admin/combinaciones");
  revalidatePath(`/admin/combinaciones/${id}`);
  return {};
}

export async function eliminarCombinacion(id: string, _formData: FormData) {
  await requireAdmin();

  const combinacion = await prisma.combinacionMosaico.delete({
    where: { id },
    include: { producto: { select: { nombre: true } } },
  });
  await registrarAuditoria({
    accion: "eliminar",
    entidad: "CombinacionMosaico",
    entidadId: id,
    detalle: combinacion.producto.nombre,
  });

  revalidatePath("/admin/combinaciones");
  redirect("/admin/combinaciones");
}
