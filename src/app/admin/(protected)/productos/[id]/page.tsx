import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { ETIQUETA_TIPO } from "@/lib/types";
import type {
  EspecificacionesMoldura,
  EspecificacionesMosaico,
} from "@/lib/types";
import { ProductoForm } from "../ProductoForm";
import {
  actualizarProducto,
  agregarRelacionado,
  actualizarOrdenImagen,
  borrarImagen,
  eliminarProducto,
  quitarRelacionado,
  subirImagenesProducto,
} from "../actions";

const inputClass =
  "rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [producto, categorias, otrosProductos] = await Promise.all([
    prisma.producto.findUnique({
      where: { id },
      include: {
        imagenes: { orderBy: { orden: "asc" } },
        relacionadoDesde: {
          include: { relacionado: { select: { id: true, nombre: true, tipo: true } } },
        },
      },
    }),
    prisma.categoria.findMany({
      orderBy: { orden: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.producto.findMany({
      where: { id: { not: id } },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, tipo: true },
    }),
  ]);

  if (!producto) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Editar producto
      </h1>
      <p className="mt-1 text-sm text-neutral-600">{producto.nombre}</p>

      <div className="mt-6">
        <ProductoForm
          action={actualizarProducto.bind(null, producto.id)}
          categorias={categorias}
          textoBoton="Guardar cambios"
          valoresIniciales={{
            nombre: producto.nombre,
            slug: producto.slug,
            sku: producto.sku,
            tipo: producto.tipo,
            categoriaId: producto.categoriaId,
            descripcion: producto.descripcion,
            estilo: producto.estilo,
            acabado: producto.acabado,
            colores: producto.colores,
            aplicaciones: producto.aplicaciones,
            disponibilidad: producto.disponibilidad,
            destacado: producto.destacado,
            activo: producto.activo,
            especificaciones: producto.especificaciones as
              | EspecificacionesMosaico
              | EspecificacionesMoldura
              | null,
          }}
        />
      </div>

      <section className="mt-10 border-t border-neutral-200 pt-8">
        <h2 className="text-lg font-semibold text-neutral-900">Fotos</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Mientras no subas fotos, el sitio público muestra un marcador con
          el nombre del producto — no un ícono de imagen rota.
        </p>

        {producto.imagenes.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {producto.imagenes.map((imagen) => (
              <li
                key={imagen.id}
                className="overflow-hidden rounded-lg border border-neutral-200"
              >
                <div className="relative aspect-square w-full bg-neutral-100">
                  <Image
                    src={imagen.url}
                    alt={imagen.alt || producto.nombre}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <form
                    action={actualizarOrdenImagen.bind(
                      null,
                      producto.id,
                      imagen.id
                    )}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="number"
                      name="orden"
                      defaultValue={imagen.orden}
                      className={`${inputClass} w-14 px-1.5 py-1`}
                      aria-label="Orden"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                    >
                      Ordenar
                    </button>
                  </form>
                  <form action={borrarImagen.bind(null, producto.id, imagen.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="¿Borrar esta foto?"
                      className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Borrar
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          action={subirImagenesProducto.bind(null, producto.id)}
          className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-neutral-300 p-4"
        >
          <input
            type="file"
            name="imagenes"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Subir fotos
          </button>
        </form>
      </section>

      <section className="mt-10 border-t border-neutral-200 pt-8">
        <h2 className="text-lg font-semibold text-neutral-900">
          Productos relacionados
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Usa &quot;Complementario&quot; para la moldura a juego de un
          mosaico (o viceversa), y &quot;Similar&quot; para otro producto
          parecido.
        </p>

        {producto.relacionadoDesde.length > 0 && (
          <ul className="mt-4 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {producto.relacionadoDesde.map((relacion) => (
              <li
                key={relacion.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span>
                  {relacion.relacionado.nombre}{" "}
                  <span className="text-neutral-400">
                    ({ETIQUETA_TIPO[relacion.relacionado.tipo]})
                  </span>
                  <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                    {relacion.tipoRelacion === "COMPLEMENTARIO"
                      ? "Complementario"
                      : "Similar"}
                  </span>
                </span>
                <form
                  action={quitarRelacionado.bind(null, producto.id, relacion.id)}
                >
                  <ConfirmSubmitButton
                    confirmMessage="¿Quitar esta relación?"
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Quitar
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}

        {otrosProductos.length > 0 && (
          <form
            action={agregarRelacionado.bind(null, producto.id)}
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <select name="relacionadoId" required className={inputClass}>
              <option value="">Selecciona un producto…</option>
              {otrosProductos.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nombre} ({ETIQUETA_TIPO[op.tipo]})
                </option>
              ))}
            </select>
            <select name="tipoRelacion" className={inputClass}>
              <option value="COMPLEMENTARIO">Complementario</option>
              <option value="SIMILAR">Similar</option>
            </select>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Agregar relación
            </button>
          </form>
        )}
      </section>

      <section className="mt-10 border-t border-neutral-200 pt-8">
        <h2 className="text-lg font-semibold text-red-700">Zona de riesgo</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Borrar el producto también borra sus fotos. No se puede deshacer.
        </p>
        <form action={eliminarProducto.bind(null, producto.id)} className="mt-3">
          <ConfirmSubmitButton
            confirmMessage={`¿Borrar "${producto.nombre}" para siempre? Esto no se puede deshacer.`}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Borrar producto
          </ConfirmSubmitButton>
        </form>
      </section>
    </div>
  );
}
