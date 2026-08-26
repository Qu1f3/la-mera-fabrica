import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NuevoMovimientoForm } from "./NuevoMovimientoForm";

export const metadata = { title: "Nuevo movimiento — Panel administrativo" };

export default async function NuevoMovimientoPage() {
  const [materiales, proveedores] = await Promise.all([
    prisma.materialInventario.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        unidadMedida: true,
        cantidadPorUnidad: true,
        cantidadActual: true,
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.proveedor.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/inventario"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Inventario
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        Nuevo movimiento
      </h1>
      <NuevoMovimientoForm
        materiales={materiales.map((m) => ({
          ...m,
          cantidadPorUnidad: m.cantidadPorUnidad.toString(),
          cantidadActual: m.cantidadActual.toString(),
        }))}
        proveedores={proveedores}
      />
    </div>
  );
}
