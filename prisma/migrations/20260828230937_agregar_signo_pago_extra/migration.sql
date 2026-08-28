-- CreateEnum
CREATE TYPE "SignoPagoExtra" AS ENUM ('SUMA', 'RESTA');

-- AlterTable
ALTER TABLE "tipos_pago_extra" ADD COLUMN     "signo" "SignoPagoExtra" NOT NULL DEFAULT 'SUMA';
