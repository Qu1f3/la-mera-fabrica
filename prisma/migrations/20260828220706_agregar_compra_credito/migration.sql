-- AlterTable
ALTER TABLE "compras" ADD COLUMN     "fechaPago" TIMESTAMP(3),
ADD COLUMN     "pagada" BOOLEAN NOT NULL DEFAULT true;
