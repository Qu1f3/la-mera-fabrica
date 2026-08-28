// Script de una sola vez: genera los Ingreso/Gasto automáticos que
// faltan para todo lo que ya existía ANTES de automatizar Finanzas
// (pedidos, pagos semanales y compras ya registrados). Después de correr
// esto una vez, todo lo nuevo se genera solo desde las acciones normales
// (crear pedido, marcar pago semanal como pagado, registrar una compra).
//
// Correr UNA sola vez, después de `npx prisma migrate dev`:
//   node scripts/backfill-finanzas.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const creados = { anticipos: 0, pagosFinales: 0, gastosEmpleados: 0, gastosCompras: 0 };

  const pedidos = await prisma.pedido.findMany({
    select: {
      id: true,
      codigo: true,
      creadoEn: true,
      fechaEntregaReal: true,
      estado: true,
      montoAnticipo: true,
      saldoPendiente: true,
    },
  });

  for (const pedido of pedidos) {
    if (Number(pedido.montoAnticipo) > 0) {
      const yaExiste = await prisma.ingreso.findFirst({
        where: { pedidoId: pedido.id, categoria: "ANTICIPO" },
      });
      if (!yaExiste) {
        await prisma.ingreso.create({
          data: {
            categoria: "ANTICIPO",
            monto: pedido.montoAnticipo,
            fecha: pedido.creadoEn,
            pedidoId: pedido.id,
            descripcion: `Anticipo de pedido ${pedido.codigo}`,
          },
        });
        creados.anticipos++;
      }
    }

    if (pedido.estado === "ENTREGADO" && Number(pedido.saldoPendiente) > 0) {
      const yaExiste = await prisma.ingreso.findFirst({
        where: { pedidoId: pedido.id, categoria: "PAGO_FINAL" },
      });
      if (!yaExiste) {
        await prisma.ingreso.create({
          data: {
            categoria: "PAGO_FINAL",
            monto: pedido.saldoPendiente,
            fecha: pedido.fechaEntregaReal ?? pedido.creadoEn,
            pedidoId: pedido.id,
            descripcion: `Pago final de pedido ${pedido.codigo}`,
          },
        });
        creados.pagosFinales++;
      }
    }
  }

  const pagos = await prisma.pagoEmpleado.findMany({
    where: { estado: "PAGADO", gasto: null },
    include: { empleado: true },
  });
  for (const pago of pagos) {
    const monto = pago.montoPagado ?? pago.totalGanado;
    await prisma.gasto.create({
      data: {
        categoria: "EMPLEADOS",
        monto,
        fecha: pago.fechaPago ?? pago.creadoEn,
        pagoEmpleadoId: pago.id,
        descripcion: `Pago semanal de ${pago.empleado.nombre}`,
      },
    });
    creados.gastosEmpleados++;
  }

  const compras = await prisma.compra.findMany({
    where: { gasto: null },
    include: {
      proveedor: true,
      movimientos: { include: { material: true }, take: 1 },
    },
  });
  for (const compra of compras) {
    const material = compra.movimientos[0]?.material;
    await prisma.gasto.create({
      data: {
        categoria: "MATERIALES",
        monto: compra.montoTotal,
        fecha: compra.fecha,
        compraId: compra.id,
        descripcion: `Compra de ${material ? material.nombre : "material"} a ${compra.proveedor.nombre}`,
      },
    });
    creados.gastosCompras++;
  }

  console.log("Backfill completo:", creados);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
