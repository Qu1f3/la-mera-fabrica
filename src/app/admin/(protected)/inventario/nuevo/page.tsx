import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NuevoMaterialForm } from "./NuevoMaterialForm";

export const metadata = { title: "Nuevo material — Panel administrativo" };

export default async function NuevoMaterialPage() {
  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/inventario"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Inventario
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        Nuevo material
      </h1>
      <NuevoMaterialForm proveedores={proveedores} />
    </div>
  );
}
