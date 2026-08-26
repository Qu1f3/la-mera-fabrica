/*
  Warnings:

  - The values [ANTICIPO_CONFIRMADO,FECHA_ASIGNADA,EN_ENTREGA] on the enum `EstadoPedido` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoPedido_new" AS ENUM ('PEDIDO_RECIBIDO', 'EN_PRODUCCION', 'EN_SECADO', 'EN_RIEGO', 'LISTO', 'ENTREGADO', 'CANCELADO');
ALTER TABLE "public"."pedidos" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "pedidos" ALTER COLUMN "estado" TYPE "EstadoPedido_new" USING ("estado"::text::"EstadoPedido_new");
ALTER TABLE "historial_estado_pedido" ALTER COLUMN "estado" TYPE "EstadoPedido_new" USING ("estado"::text::"EstadoPedido_new");
ALTER TYPE "EstadoPedido" RENAME TO "EstadoPedido_old";
ALTER TYPE "EstadoPedido_new" RENAME TO "EstadoPedido";
DROP TYPE "public"."EstadoPedido_old";
ALTER TABLE "pedidos" ALTER COLUMN "estado" SET DEFAULT 'PEDIDO_RECIBIDO';
COMMIT;
