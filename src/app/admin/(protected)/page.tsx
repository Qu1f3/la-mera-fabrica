import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rangoDiaHonduras } from "@/lib/fecha";
import { requireRolAdmin } from "@/lib/supabase/adminUsuario";

export const metadata = { title: "Inicio — Panel administrativo" };

export default async function AdminDashboardPage() {
  // El dashboard muestra estadisticas de TODO el negocio (cotizaciones,
  // clientes, contenido del sitio, etc.) -- fuera del alcance de un
  // AdminUsuario con rol EMPLEADO. Se redirige a su seccion de entrada en
  // vez de mostrarle un resumen que no le corresponde.
  await requireRolAdmin();

  const { inicio: hoyInicio, fin: hoyFin } = rangoDiaHonduras();

  const [
    productos,
    categorias,
    cotizacionesNuevas,
    config,
    piezasContenido,
    clientes,
    pedidosActivos,
    pedidosListos,
    entregasHoy,
    empleadosActivos,
    pagosSemanalesPendientes,
  ] = await Promise.all([
    prisma.producto.count(),
    prisma.categoria.count(),
    prisma.solicitudCotizacion.count({ where: { estado: "NUEVA" } }),
    prisma.configuracion.findUnique({ where: { id: "global" } }),
    Promise.all([
      prisma.banner.count(),
      prisma.faq.count(),
      prisma.testimonio.count(),
    ]).then(([banners, faqs, testimonios]) => banners + faqs + testimonios),
    prisma.cliente.count(),
    prisma.pedido.count({
      where: { estado: { notIn: ["ENTREGADO", "CANCELADO"] } },
    }),
    prisma.pedido.count({ where: { estado: "LISTO" } }),
    prisma.pedido.count({
      where: {
        fechaPrometida: { gte: hoyInicio, lt: hoyFin },
        estado: { notIn: ["ENTREGADO", "CANCELADO"] },
      },
    }),
    prisma.empleado.count({ where: { activo: true } }),
    prisma.pagoEmpleado.count({ where: { estado: "PENDIENTE" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Bienvenido</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Resumen rápido de pedidos y del sitio público.
      </p>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Pedidos
      </h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/pedidos"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{pedidosActivos}</p>
          <p className="text-sm text-neutral-600">pedidos activos</p>
        </Link>
        <Link
          href="/admin/pedidos?estado=LISTO"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{pedidosListos}</p>
          <p className="text-sm text-neutral-600">
            {pedidosListos === 1 ? "pedido listo" : "pedidos listos"} para entregar
          </p>
        </Link>
        <Link
          href="/admin/pedidos"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{entregasHoy}</p>
          <p className="text-sm text-neutral-600">
            {entregasHoy === 1 ? "entrega prometida" : "entregas prometidas"} para hoy
          </p>
        </Link>
        <Link
          href="/admin/clientes"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{clientes}</p>
          <p className="text-sm text-neutral-600">clientes registrados</p>
        </Link>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Operación
      </h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/empleados"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{empleadosActivos}</p>
          <p className="text-sm text-neutral-600">empleados activos</p>
        </Link>
        <Link
          href="/admin/pagos-semanales"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">
            {pagosSemanalesPendientes}
          </p>
          <p className="text-sm text-neutral-600">
            {pagosSemanalesPendientes === 1
              ? "pago semanal pendiente"
              : "pagos semanales pendientes"}
          </p>
        </Link>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Sitio público
      </h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/productos"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{productos}</p>
          <p className="text-sm text-neutral-600">productos — ver todos</p>
        </Link>
        <Link
          href="/admin/categorias"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">{categorias}</p>
          <p className="text-sm text-neutral-600">categorías — ver todas</p>
        </Link>
        <Link
          href="/admin/cotizaciones"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">
            {cotizacionesNuevas}
          </p>
          <p className="text-sm text-neutral-600">
            {cotizacionesNuevas === 1
              ? "cotización nueva sin contactar"
              : "cotizaciones nuevas sin contactar"}
          </p>
        </Link>
        <Link
          href="/admin/contenido"
          className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300"
        >
          <p className="text-2xl font-semibold text-neutral-900">
            {piezasContenido}
          </p>
          <p className="text-sm text-neutral-600">
            piezas de contenido — banners, FAQ, testimonios
          </p>
        </Link>
      </div>

      {!config?.whatsappNumero && (
        <Link
          href="/admin/configuracion"
          className="mt-6 block rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          ⚠️ Falta configurar el número de WhatsApp del negocio.
        </Link>
      )}
    </div>
  );
}
