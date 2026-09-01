"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { useToastAccion } from "@/components/admin/ui/Toast";
import { actualizarCategoria, eliminarCategoria } from "./actions";

const inputClass =
  "rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

type CategoriaConConteo = {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
  _count: { productos: number };
};

export function FilaCategoria({ categoria }: { categoria: CategoriaConConteo }) {
  const [estadoGuardar, formActionGuardar] = useActionState(
    actualizarCategoria.bind(null, categoria.id),
    {}
  );
  useToastAccion(estadoGuardar, "Categoría actualizada.");

  const [estadoBorrar, formActionBorrar] = useActionState(
    eliminarCategoria.bind(null, categoria.id),
    {}
  );
  useToastAccion(estadoBorrar, "Categoría eliminada.");

  return (
    <tr>
      <td colSpan={6} className="p-0">
        <form
          action={formActionGuardar}
          className="grid grid-cols-6 items-center gap-2 px-4 py-2.5"
        >
          <input
            name="nombre"
            defaultValue={categoria.nombre}
            required
            className={inputClass}
          />
          <input
            name="slug"
            defaultValue={categoria.slug}
            className={`${inputClass} text-neutral-500`}
          />
          <input
            type="number"
            name="orden"
            defaultValue={categoria.orden}
            className={`${inputClass} w-20`}
          />
          <input
            type="checkbox"
            name="activo"
            defaultChecked={categoria.activo}
            className="h-4 w-4"
          />
          <span className="text-neutral-500">
            {categoria._count.productos}
          </span>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Guardar
            </button>
            <ConfirmSubmitButton
              formAction={formActionBorrar}
              confirmMessage={`¿Borrar la categoría "${categoria.nombre}"? Los productos que la usan quedan sin categoría, no se borran.`}
              className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Borrar
            </ConfirmSubmitButton>
          </div>
        </form>
      </td>
    </tr>
  );
}
