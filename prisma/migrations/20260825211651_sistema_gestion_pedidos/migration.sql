-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PEDIDO_RECIBIDO', 'ANTICIPO_CONFIRMADO', 'FECHA_ASIGNADA', 'EN_PRODUCCION', 'EN_SECADO', 'EN_RIEGO', 'LISTO', 'EN_ENTREGA', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoEntrega" AS ENUM ('PENDIENTE', 'LISTO', 'EN_ENTREGA', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoPagoSemanal" AS ENUM ('PENDIENTE', 'PAGADO');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "TipoIngreso" AS ENUM ('VENTA', 'ANTICIPO', 'PAGO_FINAL', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('MATERIALES', 'EMPLEADOS', 'COMBUSTIBLE', 'ELECTRICIDAD', 'AGUA', 'MANTENIMIENTO', 'TRANSPORTE', 'REPARACIONES', 'OTROS');

-- AlterTable
ALTER TABLE "configuracion" ADD COLUMN     "montoMezclaActual" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "precioActual" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fechaPrometida" TIMESTAMP(3),
    "fechaEntregaReal" TIMESTAMP(3),
    "porcentajeAnticipo" DECIMAL(5,2) NOT NULL DEFAULT 60,
    "montoAnticipo" DECIMAL(10,2) NOT NULL,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "saldoPendiente" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PEDIDO_RECIBIDO',
    "fechaInicioSecado" TIMESTAMP(3),
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "categoria" TEXT,
    "diseno" TEXT,
    "color" TEXT,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "items_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_estado_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL,
    "adminUsuarioId" TEXT NOT NULL,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_estado_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_riego" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "adminUsuarioId" TEXT NOT NULL,
    "observacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_riego_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3),
    "fechaReal" TIMESTAMP(3),
    "estado" "EstadoEntrega" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "fechaIngreso" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago_unitario_producto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pago_unitario_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_produccion" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empleadoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidadProducida" INTEGER NOT NULL,
    "unidadesDefectuosas" INTEGER NOT NULL DEFAULT 0,
    "pagoUnitario" DECIMAL(10,2) NOT NULL,
    "totalGanado" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_mezcla" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_mezcla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_pago_extra" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "montoSugerido" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_pago_extra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_extra_empleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tipoPagoExtraId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_extra_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_empleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "semanaInicio" TIMESTAMP(3) NOT NULL,
    "semanaFin" TIMESTAMP(3) NOT NULL,
    "totalProduccion" DECIMAL(10,2) NOT NULL,
    "totalMezcla" DECIMAL(10,2) NOT NULL,
    "totalExtras" DECIMAL(10,2) NOT NULL,
    "totalGanado" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPagoSemanal" NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" TIMESTAMP(3),
    "montoPagado" DECIMAL(10,2),
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiales_inventario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "cantidadActual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cantidadMinima" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costo" DECIMAL(10,2),
    "proveedorId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiales_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "tipo" "TipoMovimientoInventario" NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compraId" TEXT,
    "costo" DECIMAL(10,2),
    "referencia" TEXT,
    "motivo" TEXT,
    "notas" TEXT,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingresos" (
    "id" TEXT NOT NULL,
    "categoria" "TipoIngreso" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pedidoId" TEXT,
    "descripcion" TEXT,
    "notas" TEXT,

    CONSTRAINT "ingresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "categoria" "TipoGasto" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "notas" TEXT,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_mensaje" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_codigo_key" ON "pedidos"("codigo");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_idx" ON "pedidos"("clienteId");

-- CreateIndex
CREATE INDEX "items_pedido_pedidoId_idx" ON "items_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "historial_estado_pedido_pedidoId_idx" ON "historial_estado_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "registros_riego_pedidoId_idx" ON "registros_riego"("pedidoId");

-- CreateIndex
CREATE INDEX "entregas_pedidoId_idx" ON "entregas"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "pago_unitario_producto_productoId_key" ON "pago_unitario_producto"("productoId");

-- CreateIndex
CREATE INDEX "registros_produccion_empleadoId_idx" ON "registros_produccion"("empleadoId");

-- CreateIndex
CREATE INDEX "registros_produccion_fecha_idx" ON "registros_produccion"("fecha");

-- CreateIndex
CREATE INDEX "registros_mezcla_empleadoId_idx" ON "registros_mezcla"("empleadoId");

-- CreateIndex
CREATE INDEX "pagos_extra_empleado_empleadoId_idx" ON "pagos_extra_empleado"("empleadoId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_empleado_empleadoId_semanaInicio_key" ON "pagos_empleado"("empleadoId", "semanaInicio");

-- CreateIndex
CREATE INDEX "movimientos_inventario_materialId_idx" ON "movimientos_inventario"("materialId");

-- CreateIndex
CREATE INDEX "ingresos_fecha_idx" ON "ingresos"("fecha");

-- CreateIndex
CREATE INDEX "gastos_fecha_idx" ON "gastos"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_mensaje_clave_key" ON "plantillas_mensaje"("clave");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado_pedido" ADD CONSTRAINT "historial_estado_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estado_pedido" ADD CONSTRAINT "historial_estado_pedido_adminUsuarioId_fkey" FOREIGN KEY ("adminUsuarioId") REFERENCES "admin_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_riego" ADD CONSTRAINT "registros_riego_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_riego" ADD CONSTRAINT "registros_riego_adminUsuarioId_fkey" FOREIGN KEY ("adminUsuarioId") REFERENCES "admin_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_unitario_producto" ADD CONSTRAINT "pago_unitario_producto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_produccion" ADD CONSTRAINT "registros_produccion_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_produccion" ADD CONSTRAINT "registros_produccion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_mezcla" ADD CONSTRAINT "registros_mezcla_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_extra_empleado" ADD CONSTRAINT "pagos_extra_empleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_extra_empleado" ADD CONSTRAINT "pagos_extra_empleado_tipoPagoExtraId_fkey" FOREIGN KEY ("tipoPagoExtraId") REFERENCES "tipos_pago_extra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_empleado" ADD CONSTRAINT "pagos_empleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiales_inventario" ADD CONSTRAINT "materiales_inventario_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiales_inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
