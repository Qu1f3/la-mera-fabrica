import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRolAdmin } from "@/lib/supabase/adminUsuario";
import { PagoUnitarioRow } from "./PagoUnitarioRow";

export const metadata = { title: "Pago por unidad — Panel administrativo" };

export default async function PagoUnitarioPage() {
  // Cuánto se le paga a cada empleado por pieza es una decisión del dueño,
  // no una tarea de un EMPLEADO -- esta ruta vive fuera de
  // (solo-dueno)/ (porque el resto de Producción SÍ le corresponde a un
  // EMPLEADO), así que necesita su propio guard en vez de heredar el del
  // route group. El enlace hacia acá desde /admin/produccion ya está
  // escondido para no-ADMIN, pero esto bloquea también si alguien escribe
  // la URL directamente.
  await requireRolAdmin();

  const productos = await prisma.producto.findMany({
    include: { pagoUnitario: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div>
      <Link
        href="/admin/produccion"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Producción
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        Pago por unidad
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Cuánto se le paga al empleado por cada pieza producida de cada
        producto. Cambiar un monto acá no afecta los registros de producción
        que ya se guardaron.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Pago por unidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {productos.map((producto) => (
              <PagoUnitarioRow
                key={producto.id}
                productoId={producto.id}
                nombre={producto.nombre}
                montoActual={
                  producto.pagoUnitario ? producto.pagoUnitario.monto.toString() : ""
                }
              />
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-neutral-500">
                  Todavía no hay productos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
