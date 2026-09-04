import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NuevaExistenciaForm } from "./NuevaExistenciaForm";

export const metadata = { title: "Registrar existencia — Panel administrativo" };

export default async function NuevaExistenciaPage() {
  // Solo mosaicos que todavía no tienen existencia registrada -- si ya
  // tiene una, se edita en vez de crear otra (es @unique por productoId).
  const productos = await prisma.producto.findMany({
    where: { tipo: "MOSAICO", existenciaMosaico: null },
    select: { id: true, nombre: true, sku: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="max-w-md">
      <Link href="/admin/existencia" className="text-sm text-neutral-500 hover:text-neutral-800">
        ← Existencia
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Registrar existencia</h1>

      {productos.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
          Todos los mosaicos del catálogo ya tienen existencia registrada. Para cambiar una,
          edítala desde la lista.
        </p>
      ) : (
        <NuevaExistenciaForm productos={productos} />
      )}
    </div>
  );
}
