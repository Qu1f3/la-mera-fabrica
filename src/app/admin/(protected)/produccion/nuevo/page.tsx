import Link from "next/link";
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
      select: { id: true, nombre: true, sku: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.configuracion.findUnique({ where: { id: "global" } }),
  ]);

  const montoMezclaDefault = configuracion?.montoMezclaActual
    ? configuracion.montoMezclaActual.toString()
    : String(MONTO_MEZCLA_DEFAULT);

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/produccion"
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Producción
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
        Nuevo registro de producción
      </h1>
      <NuevoRegistroProduccionForm
        empleados={empleados}
        productos={productos}
        montoMezclaDefault={montoMezclaDefault}
      />
    </div>
  );
}
