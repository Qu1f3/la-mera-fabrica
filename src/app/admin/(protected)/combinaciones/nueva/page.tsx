import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NuevaCombinacionForm } from "./NuevaCombinacionForm";

export const metadata = { title: "Nueva combinación — Panel administrativo" };

export default async function NuevaCombinacionPage() {
  // Solo mosaicos que todavía no tienen combinación registrada (es
  // @unique por productoId -- ver schema.prisma) -- si ya tiene una, se
  // edita en vez de crear otra.
  const productos = await prisma.producto.findMany({
    where: { tipo: "MOSAICO", combinacionMosaico: null },
    select: { id: true, nombre: true, sku: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <Link href="/admin/combinaciones" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Combinaciones
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Nueva combinación</h1>

      {productos.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
          Todos los mosaicos del catálogo ya tienen una combinación registrada. Para cambiar una,
          edítala desde la lista.
        </p>
      ) : (
        <NuevaCombinacionForm productos={productos} />
      )}
    </div>
  );
}
