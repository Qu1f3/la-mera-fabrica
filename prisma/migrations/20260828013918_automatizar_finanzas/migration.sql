/*
  Warnings:

  - A unique constraint covering the columns `[pagoEmpleadoId]` on the table `gastos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[compraId]` on the table `gastos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "gastos" ADD COLUMN     "compraId" TEXT,
ADD COLUMN     "pagoEmpleadoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "gastos_pagoEmpleadoId_key" ON "gastos"("pagoEmpleadoId");

-- CreateIndex
CREATE UNIQUE INDEX "gastos_compraId_key" ON "gastos"("compraId");

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_pagoEmpleadoId_fkey" FOREIGN KEY ("pagoEmpleadoId") REFERENCES "pagos_empleado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE SET NULL ON UPDATE CASCADE;
