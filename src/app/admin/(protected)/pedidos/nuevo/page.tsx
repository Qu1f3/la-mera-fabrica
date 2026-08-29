import { prisma } from "@/lib/prisma";
import { NuevoPedidoForm } from "./NuevoPedidoForm";

export const metadata = { title: "Nuevo pedido — Panel administrativo" };

export default async function NuevoPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;

  const [clientes, productos] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, telefono: true },
    }),
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        sku: true,
        tipo: true,
        estilo: true,
        precioActual: true,
        categoria: { select: { nombre: true } },
        imagenes: { select: { url: true }, orderBy: { orden: "asc" }, take: 1 },
      },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Nuevo pedido</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Selecciona el cliente, agrega los productos y el sistema calcula el
        anticipo y el saldo automáticamente.
      </p>
      <div className="mt-6">
        <NuevoPedidoForm
          clientesIniciales={clientes}
          productos={productos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            sku: p.sku,
            tipo: p.tipo,
            categoria: p.categoria?.nombre ?? null,
            diseno: p.estilo,
            precioActual: p.precioActual ? Number(p.precioActual) : 0,
            imagenUrl: p.imagenes[0]?.url,
          }))}
          clienteIdInicial={clienteId ?? ""}
        />
      </div>
    </div>
  );
}
