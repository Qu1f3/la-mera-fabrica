import { prisma } from "@/lib/prisma";
import { ProductoForm } from "../ProductoForm";
import { crearProducto } from "../actions";

export const metadata = { title: "Nuevo producto — Panel administrativo" };

export default async function NuevoProductoPage() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Nuevo producto
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Después de crearlo vas a poder subirle fotos y relacionarlo con otros
        productos (por ejemplo, la moldura a juego).
      </p>

      <div className="mt-6">
        <ProductoForm
          action={crearProducto}
          categorias={categorias}
          textoBoton="Crear producto"
        />
      </div>
    </div>
  );
}
