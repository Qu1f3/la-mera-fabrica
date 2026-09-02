// Corrige registros existentes guardados con el bug de zona horaria:
// el helper viejo (fechaDesdeInput) armaba medianoche UTC (00:00:00.000Z)
// en vez de medianoche Honduras (06:00:00.000Z), asi que al mostrarse
// convertido a hora de Honduras/Guatemala caia un dia antes.
//
// Este script SUMA 6 horas solo a los registros cuya hora es EXACTAMENTE
// 00:00:00.000 UTC -- esa es la firma del bug (una fecha real con hora
// real, como "new Date()" por defecto, practicamente nunca cae justo ahi).
//
// Por defecto corre en modo DRY-RUN (no escribe nada, solo muestra que
// haria). Para aplicar los cambios de verdad:
//   node scripts/aplicar-fix-fechas-honduras.cjs --aplicar

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const APLICAR = process.argv.includes("--aplicar");
const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;

function esMedianocheUTC(fecha) {
  if (!fecha) return false;
  return (
    fecha.getUTCHours() === 0 &&
    fecha.getUTCMinutes() === 0 &&
    fecha.getUTCSeconds() === 0 &&
    fecha.getUTCMilliseconds() === 0
  );
}

async function corregir(modelo, campo, where) {
  const registros = await prisma[modelo].findMany({
    where,
    select: { id: true, [campo]: true },
  });
  const afectados = registros.filter((r) => esMedianocheUTC(r[campo]));

  for (const r of afectados) {
    const original = r[campo];
    const corregida = new Date(original.getTime() + SEIS_HORAS_MS);
    console.log(
      `  ${modelo}.${campo} id=${r.id}: ${original.toISOString()} -> ${corregida.toISOString()}`
    );
    if (APLICAR) {
      await prisma[modelo].update({
        where: { id: r.id },
        data: { [campo]: corregida },
      });
    }
  }
  return afectados.length;
}

async function main() {
  console.log(APLICAR ? "\n=== APLICANDO correcciones ===\n" : "\n=== DRY-RUN (nada se escribe todavia) ===\n");

  let total = 0;
  total += await corregir("pedido", "fechaPrometida", { fechaPrometida: { not: null } });
  total += await corregir("entrega", "fechaProgramada", { fechaProgramada: { not: null } });
  total += await corregir("pagoEmpleado", "semanaInicio", {});
  total += await corregir("pagoEmpleado", "semanaFin", {});
  total += await corregir("pagoEmpleado", "fechaPago", { fechaPago: { not: null } });
  total += await corregir("empleado", "fechaIngreso", { fechaIngreso: { not: null } });
  total += await corregir("compra", "fechaPago", { fechaPago: { not: null } });

  console.log(`\nTotal de registros ${APLICAR ? "corregidos" : "que se corregirian"}: ${total}`);
  if (!APLICAR) {
    console.log("\nEsto fue un dry-run. Revisa la lista de arriba y si se ve bien, corre:");
    console.log("  node scripts/aplicar-fix-fechas-honduras.cjs --aplicar\n");
  } else {
    console.log("\nListo.\n");
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
