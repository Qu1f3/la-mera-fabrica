-- CreateTable
CREATE TABLE "combinaciones_mosaico" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combinaciones_mosaico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "componentes_combinacion" (
    "id" TEXT NOT NULL,
    "combinacionId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "nombre" TEXT NOT NULL,
    "cementoCantidad" DECIMAL(10,2),
    "cementoUnidad" TEXT,
    "coloranteColor" TEXT,
    "coloranteCantidad" DECIMAL(10,2),
    "coloranteUnidad" TEXT,
    "notas" TEXT,

    CONSTRAINT "componentes_combinacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "combinaciones_mosaico_productoId_key" ON "combinaciones_mosaico"("productoId");

-- CreateIndex
CREATE INDEX "componentes_combinacion_combinacionId_idx" ON "componentes_combinacion"("combinacionId");

-- AddForeignKey
ALTER TABLE "combinaciones_mosaico" ADD CONSTRAINT "combinaciones_mosaico_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componentes_combinacion" ADD CONSTRAINT "componentes_combinacion_combinacionId_fkey" FOREIGN KEY ("combinacionId") REFERENCES "combinaciones_mosaico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
