-- AlterTable
ALTER TABLE "materiales_inventario" ADD COLUMN     "cantidadPorUnidad" DECIMAL(10,2) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "movimientos_inventario" ADD COLUMN     "cantidadPorUnidad" DECIMAL(10,2) NOT NULL DEFAULT 1;
