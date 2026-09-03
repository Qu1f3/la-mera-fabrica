import { prisma } from "@/lib/prisma";
import { MONTO_MEZCLA_DEFAULT } from "../constants";
import { NuevoRegistroProduccionForm } from "./NuevoRegistroProduccionForm";

export const metadata = { title: "Nuevo registro de producción — Panel administrativo" };

export default async function NuevoRegistroProduccionPage() {
  const [empleados, productos, configuracion] = await Promise.all([
    prisma.empleado.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      select: {
        id: true,
        nombre: true,
        sku: true,
        imagenes: {
          select: { url: true },
          orderBy: { orden: "asc" },
          take: 1,
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.configuracion.findUnique({ where: { id: "global" } }),
  ]);

  const montoMezclaDefault = configuracion?.montoMezclaActual
    ? configuracion.montoMezclaActual.toString()
    : String(MONTO_MEZCLA_DEFAULT);

  return (
    <div className="max-w-2xl">
      {/* <a> a propósito, no <Link>: esta página y /admin/produccion son
          rutas sin conexión (ver propuesta-modo-offline.md) -- una
          navegación de verdad es lo que el service worker sabe
          interceptar y servir desde caché si no hay señal. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a propósito, ver comentario arriba */}
      <a href="/admin/produccion" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Producción
      </a>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        Nuevo registro de producción
      </h1>
      <NuevoRegistroProduccionForm
        empleados={empleados}
        productos={productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          sku: p.sku,
          imagenUrl: p.imagenes[0]?.url,
        }))}
        montoMezclaDefault={montoMezclaDefault}
      />
    </div>
  );
}
