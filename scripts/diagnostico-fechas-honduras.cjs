// Diagnostico de solo lectura: cuenta cuantos registros tienen fechas
// guardadas con el bug (medianoche UTC exacta, 00:00:00.000Z) en vez de
// medianoche Honduras (06:00:00.000Z). No modifica nada.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function esMedianocheUTC(fecha) {
  if (!fecha) return false;
  return (
    fecha.getUTCHours() === 0 &&
    fecha.getUTCMinutes() === 0 &&
    fecha.getUTCSeconds() === 0 &&
    fecha.getUTCMilliseconds() === 0
  );
}

async function contar(modelo, campo, where) {
  const registros = await prisma[modelo].findMany({
    where,
    select: { id: true, [campo]: true },
  });
  const afectados = registros.filter((r) => esMedianocheUTC(r[campo]));
  return { total: registros.length, afectados: afectados.length, ids: afectados.map((r) => r.id) };
}

async function main() {
  const resultados = {};

  resultados["Pedido.fechaPrometida"] = await contar("pedido", "fechaPrometida", {
    fechaPrometida: { not: null },
  });
  resultados["Entrega.fechaProgramada"] = await contar("entrega", "fechaProgramada", {
    fechaProgramada: { not: null },
  });
  resultados["PagoEmpleado.semanaInicio"] = await contar("pagoEmpleado", "semanaInicio", {});
  resultados["PagoEmpleado.semanaFin"] = await contar("pagoEmpleado", "semanaFin", {});
  resultados["PagoEmpleado.fechaPago"] = await contar("pagoEmpleado", "fechaPago", {
    fechaPago: { not: null },
  });
  resultados["Empleado.fechaIngreso"] = await contar("empleado", "fechaIngreso", {
    fechaIngreso: { not: null },
  });
  resultados["Compra.fechaPago"] = await contar("compra", "fechaPago", {
    fechaPago: { not: null },
  });

  console.log("\n=== Diagnostico de fechas (solo lectura) ===\n");
  for (const [nombre, r] of Object.entries(resultados)) {
    console.log(`${nombre}: ${r.afectados} de ${r.total} registros parecen tener el bug (medianoche UTC exacta)`);
    if (r.afectados > 0 && r.afectados <= 20) {
      console.log(`  ids: ${r.ids.join(", ")}`);
    }
  }
  console.log("\n(Un registro 'afectado' es aquel cuya hora es EXACTAMENTE 00:00:00.000 UTC,");
  console.log(" que es la firma del bug -- una fecha real con hora real casi nunca cae ahi.)\n");
}

main()
  .catch((e) => {
    console.error("ERROR:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
