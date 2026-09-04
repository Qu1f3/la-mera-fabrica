-- CreateTable
CREATE TABLE "existencias_mosaico" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "existencias_mosaico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "existencias_mosaico_productoId_key" ON "existencias_mosaico"("productoId");

-- AddForeignKey
ALTER TABLE "existencias_mosaico" ADD CONSTRAINT "existencias_mosaico_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
