# Fase 2 — Propuesta de extensión de `schema.prisma`

Con tu confirmación de que un pedido puede tener **varias entregas parciales**, `Entrega` sí queda como modelo aparte (relación 1—N con `Pedido`), no como campos duplicados dentro de `Pedido`.

Cómo quedan divididos los datos de entrega con esta decisión: `Pedido` conserva `fechaPrometida` (la fecha comprometida general del pedido, la que se usa en la cola y el calendario) y `estado` (el ciclo de vida completo, incluyendo `ENTREGADO` cuando ya se entregó todo). Cada `Entrega` es un evento de entrega concreto — puede haber una sola (el caso normal) o varias si el pedido se reparte en tandas — con su propia fecha programada, fecha real y estado.

Esto es solo el **diseño para tu revisión** — todavía no toqué `prisma/schema.prisma` ni corrí ninguna migración. Si algo no calza con cómo trabajas en la práctica, dime y lo ajusto antes de aplicar nada.

---

## Cambios a modelos existentes

```prisma
model Producto {
  // ...todo lo que ya existe se queda igual...

  // Nuevo: precio de venta actual. Nunca se usa directo en un pedido ya
  // creado — ItemPedido.precioUnitario es su propia copia congelada.
  precioActual Decimal? @db.Decimal(10, 2)

  // Nuevas relaciones (no afectan filas existentes)
  itemsPedido         ItemPedido[]
  pagoUnitario        PagoUnitarioProducto?
  registrosProduccion RegistroProduccion[]
}

model AdminUsuario {
  // ...todo lo que ya existe se queda igual...

  // Nuevas relaciones: quién hizo cada cambio de estado / cada riego
  cambiosEstadoPedido HistorialEstadoPedido[]
  riegosRegistrados   RegistroRiego[]
}
```

## Pedidos

```prisma
enum EstadoPedido {
  PEDIDO_RECIBIDO
  ANTICIPO_CONFIRMADO
  FECHA_ASIGNADA
  EN_PRODUCCION
  EN_SECADO
  EN_RIEGO
  LISTO
  EN_ENTREGA
  ENTREGADO
  CANCELADO
}

enum EstadoEntrega {
  PENDIENTE
  LISTO
  EN_ENTREGA
  ENTREGADO
  CANCELADO
}

model Cliente {
  id            String   @id @default(cuid())
  nombre        String
  telefono      String
  notas         String?
  pedidos       Pedido[]
  creadoEn      DateTime @default(now())
  actualizadoEn DateTime @updatedAt

  @@map("clientes")
}

// Los montos (montoTotal, montoAnticipo, saldoPendiente) se guardan como
// columnas propias, calculadas por la app a partir de los ItemPedido y el
// porcentajeAnticipo — no se recalculan "al vuelo" en cada lectura, para que
// listados y reportes no tengan que sumar items cada vez. Cualquier cambio a
// los items o al porcentaje de anticipo debe volver a calcular estos tres
// campos en la misma operación.
model Pedido {
  id                 String                  @id @default(cuid())
  codigo             String                  @unique
  clienteId          String
  cliente            Cliente                 @relation(fields: [clienteId], references: [id])
  fechaPrometida     DateTime?
  fechaEntregaReal   DateTime?
  porcentajeAnticipo Decimal                 @default(60) @db.Decimal(5, 2)
  montoAnticipo      Decimal                 @db.Decimal(10, 2)
  montoTotal         Decimal                 @db.Decimal(10, 2)
  saldoPendiente     Decimal                 @db.Decimal(10, 2)
  estado             EstadoPedido            @default(PEDIDO_RECIBIDO)
  // Se guarda sola al pasar a EN_SECADO — de ahí se calculan los "días de
  // secado transcurridos" (hora de Honduras, no la del servidor).
  fechaInicioSecado  DateTime?
  notas              String?
  items              ItemPedido[]
  historial          HistorialEstadoPedido[]
  riegos             RegistroRiego[]
  entregas           Entrega[]
  ingresos           Ingreso[]
  creadoEn           DateTime                @default(now())
  actualizadoEn      DateTime                @updatedAt

  @@index([estado])
  @@index([clienteId])
  @@map("pedidos")
}

model ItemPedido {
  id       String @id @default(cuid())
  pedidoId String
  pedido   Pedido @relation(fields: [pedidoId], references: [id], onDelete: Cascade)

  // Sin cascada hacia Producto (igual que ItemCotizacion hoy): borrar un
  // producto no debe borrar el historial de pedidos que lo usaron.
  productoId String
  producto   Producto @relation(fields: [productoId], references: [id])

  // Copiados del producto al crear el pedido — nunca se leen "en vivo" desde
  // Producto después de este punto.
  categoria String?
  diseno    String?
  color     String?

  cantidad       Decimal @db.Decimal(10, 2)
  // Snapshot histórico: el precio del producto el día del pedido, no el
  // precio actual.
  precioUnitario Decimal @db.Decimal(10, 2)
  subtotal       Decimal @db.Decimal(10, 2)

  @@index([pedidoId])
  @@map("items_pedido")
}

model HistorialEstadoPedido {
  id             String       @id @default(cuid())
  pedidoId       String
  pedido         Pedido       @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  estado         EstadoPedido
  adminUsuarioId String
  adminUsuario   AdminUsuario @relation(fields: [adminUsuarioId], references: [id])
  notas          String?
  creadoEn       DateTime     @default(now())

  @@index([pedidoId])
  @@map("historial_estado_pedido")
}

// El riego lo hace personalmente el administrador (nunca empleados) — ver
// tu instrucción original.
model RegistroRiego {
  id             String       @id @default(cuid())
  pedidoId       String
  pedido         Pedido       @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  adminUsuarioId String
  adminUsuario   AdminUsuario @relation(fields: [adminUsuarioId], references: [id])
  observacion    String?
  creadoEn       DateTime     @default(now())

  @@index([pedidoId])
  @@map("registros_riego")
}

// Un evento de entrega concreto. Lo normal es una sola fila por pedido; solo
// hay más de una si el pedido se reparte en tandas.
model Entrega {
  id              String        @id @default(cuid())
  pedidoId        String
  pedido          Pedido        @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  fechaProgramada DateTime?
  fechaReal       DateTime?
  estado          EstadoEntrega @default(PENDIENTE)
  notas           String?
  creadoEn        DateTime      @default(now())
  actualizadoEn   DateTime      @updatedAt

  @@index([pedidoId])
  @@map("entregas")
}
```

## Empleados y producción

```prisma
enum EstadoPagoSemanal {
  PENDIENTE
  PAGADO
}

model Empleado {
  id           String                @id @default(cuid())
  nombre       String
  telefono     String?
  activo       Boolean               @default(true)
  notas        String?
  fechaIngreso DateTime?
  producciones RegistroProduccion[]
  mezclas      RegistroMezcla[]
  extras       PagoExtraEmpleado[]
  pagos        PagoEmpleado[]
  creadoEn     DateTime              @default(now())
  actualizadoEn DateTime             @updatedAt

  @@map("empleados")
}

// El valor *actual* configurable por producto/diseño. Cuando se crea un
// RegistroProduccion, se copia este monto al campo pagoUnitario del
// registro — cambiar esto después no altera registros ya creados.
model PagoUnitarioProducto {
  id            String   @id @default(cuid())
  productoId    String   @unique
  producto      Producto @relation(fields: [productoId], references: [id], onDelete: Cascade)
  monto         Decimal  @db.Decimal(10, 2)
  actualizadoEn DateTime @updatedAt

  @@map("pago_unitario_producto")
}

model RegistroProduccion {
  id                  String   @id @default(cuid())
  fecha               DateTime @default(now())
  empleadoId          String
  empleado            Empleado @relation(fields: [empleadoId], references: [id])
  productoId          String
  producto            Producto @relation(fields: [productoId], references: [id])
  cantidadProducida   Int
  unidadesDefectuosas Int      @default(0)
  // Snapshot: copiado de PagoUnitarioProducto al momento del registro.
  pagoUnitario        Decimal  @db.Decimal(10, 2)
  totalGanado         Decimal  @db.Decimal(10, 2)
  notas               String?
  creadoEn            DateTime @default(now())

  @@index([empleadoId])
  @@index([fecha])
  @@map("registros_produccion")
}

// Hoy solo un empleado hace mezcla, pero no se restringe a nivel de schema
// (así no hay que migrar si eso cambia).
model RegistroMezcla {
  id         String   @id @default(cuid())
  empleadoId String
  empleado   Empleado @relation(fields: [empleadoId], references: [id])
  fecha      DateTime @default(now())
  // Snapshot del valor configurable (Configuracion.montoMezclaActual, ver
  // más abajo) al momento del registro.
  monto      Decimal  @db.Decimal(10, 2)
  notas      String?
  creadoEn   DateTime @default(now())

  @@index([empleadoId])
  @@map("registros_mezcla")
}

// Catálogo configurable de tipos de extra (ej: "Cargar pedido al camión").
model TipoPagoExtra {
  id            String              @id @default(cuid())
  descripcion   String
  montoSugerido Decimal?            @db.Decimal(10, 2)
  activo        Boolean             @default(true)
  extras        PagoExtraEmpleado[]

  @@map("tipos_pago_extra")
}

model PagoExtraEmpleado {
  id              String         @id @default(cuid())
  empleadoId      String
  empleado        Empleado       @relation(fields: [empleadoId], references: [id])
  tipoPagoExtraId String?
  tipoPagoExtra   TipoPagoExtra? @relation(fields: [tipoPagoExtraId], references: [id])
  fecha           DateTime       @default(now())
  // Copiada (no se lee en vivo de TipoPagoExtra), igual que el monto.
  descripcion     String
  monto           Decimal        @db.Decimal(10, 2)
  notas           String?
  creadoEn        DateTime       @default(now())

  @@index([empleadoId])
  @@map("pagos_extra_empleado")
}

model PagoEmpleado {
  id              String            @id @default(cuid())
  empleadoId      String
  empleado        Empleado          @relation(fields: [empleadoId], references: [id])
  semanaInicio    DateTime
  semanaFin       DateTime
  totalProduccion Decimal           @db.Decimal(10, 2)
  totalMezcla     Decimal           @db.Decimal(10, 2)
  totalExtras     Decimal           @db.Decimal(10, 2)
  totalGanado     Decimal           @db.Decimal(10, 2)
  estado          EstadoPagoSemanal @default(PENDIENTE)
  fechaPago       DateTime?
  montoPagado     Decimal?          @db.Decimal(10, 2)
  notas           String?
  creadoEn        DateTime          @default(now())
  actualizadoEn   DateTime          @updatedAt

  @@unique([empleadoId, semanaInicio])
  @@map("pagos_empleado")
}
```

## Inventario

```prisma
enum TipoMovimientoInventario {
  ENTRADA
  SALIDA
}

model Proveedor {
  id         String               @id @default(cuid())
  nombre     String
  telefono   String?
  notas      String?
  activo     Boolean              @default(true)
  materiales MaterialInventario[]
  compras    Compra[]
  creadoEn   DateTime             @default(now())

  @@map("proveedores")
}

model MaterialInventario {
  id             String                 @id @default(cuid())
  nombre         String
  unidadMedida   String
  cantidadActual Decimal                @default(0) @db.Decimal(10, 2)
  cantidadMinima Decimal                @default(0) @db.Decimal(10, 2)
  costo          Decimal?               @db.Decimal(10, 2)
  proveedorId    String?
  proveedor      Proveedor?             @relation(fields: [proveedorId], references: [id])
  activo         Boolean                @default(true)
  notas          String?
  movimientos    MovimientoInventario[]
  creadoEn       DateTime               @default(now())
  actualizadoEn  DateTime               @updatedAt

  @@map("materiales_inventario")
}

// Las salidas son manuales (no se descuenta automático por producción, tal
// como pediste).
model MovimientoInventario {
  id         String                   @id @default(cuid())
  materialId String
  material   MaterialInventario       @relation(fields: [materialId], references: [id])
  tipo       TipoMovimientoInventario
  cantidad   Decimal                  @db.Decimal(10, 2)
  fecha      DateTime                 @default(now())
  compraId   String?
  compra     Compra?                  @relation(fields: [compraId], references: [id])
  costo      Decimal?                 @db.Decimal(10, 2)
  referencia String?
  motivo     String?
  notas      String?

  @@index([materialId])
  @@map("movimientos_inventario")
}

model Compra {
  id          String                 @id @default(cuid())
  proveedorId String
  proveedor   Proveedor              @relation(fields: [proveedorId], references: [id])
  fecha       DateTime               @default(now())
  montoTotal  Decimal                @db.Decimal(10, 2)
  notas       String?
  movimientos MovimientoInventario[]

  @@map("compras")
}
```

## Finanzas

```prisma
enum TipoIngreso {
  VENTA
  ANTICIPO
  PAGO_FINAL
  OTRO
}

enum TipoGasto {
  MATERIALES
  EMPLEADOS
  COMBUSTIBLE
  ELECTRICIDAD
  AGUA
  MANTENIMIENTO
  TRANSPORTE
  REPARACIONES
  OTROS
}

model Ingreso {
  id          String      @id @default(cuid())
  categoria   TipoIngreso
  monto       Decimal     @db.Decimal(10, 2)
  fecha       DateTime    @default(now())
  pedidoId    String?
  pedido      Pedido?     @relation(fields: [pedidoId], references: [id])
  descripcion String?
  notas       String?

  @@index([fecha])
  @@map("ingresos")
}

model Gasto {
  id          String    @id @default(cuid())
  categoria   TipoGasto
  monto       Decimal   @db.Decimal(10, 2)
  fecha       DateTime  @default(now())
  descripcion String?
  notas       String?

  @@index([fecha])
  @@map("gastos")
}
```

## Mensajería

```prisma
model PlantillaMensaje {
  id            String   @id @default(cuid())
  clave         String   @unique
  nombre        String
  cuerpo        String
  activo        Boolean  @default(true)
  actualizadoEn DateTime @updatedAt

  @@map("plantillas_mensaje")
}
```

## Configuración (reutilizando el modelo existente)

```prisma
model Configuracion {
  // ...todo lo que ya existe se queda igual...

  // Nuevo: monto configurable de mezcla (hoy L.130). Se copia a
  // RegistroMezcla.monto en cada registro nuevo — cambiarlo aquí no altera
  // registros pasados.
  montoMezclaActual Decimal? @db.Decimal(10, 2)
}
```

---

## Notas sobre esta propuesta

- Todo es aditivo: ninguna tabla, columna, enum o relación existente se modifica o se borra. La migración que esto generaría sería 100% no destructiva.
- Todos los "snapshots históricos" que pediste quedan explícitos en los comentarios de cada campo, para que quien lea el schema después entienda por qué ese campo existe (mismo estilo de documentación que ya usa tu `schema.prisma`).
- `porcentajeAnticipo` usa `Decimal(5,2)` (hasta 999.99) en vez de `Decimal(10,2)` — es un porcentaje, no un monto de dinero; la validación de que esté entre 0 y 100 la hace la aplicación (Zod), no la base de datos.
- No agrego restricciones de base de datos para "no negativos" (cantidad, precio, anticipo) — eso también lo valida la aplicación con Zod, siguiendo el mismo patrón que ya usan los formularios existentes del panel.

## Siguiente paso

Si esto se ve bien, en la Fase 3 agrego estos bloques a `prisma/schema.prisma`, corro `prisma migrate dev` (contra la base de datos real, ya que no hay ambiente de staging — te aviso antes de correrla) y empiezo a construir Clientes → Pedidos → Items → Estados → Historial, más el kit de componentes de UI compartido (Tabs/Modal/Toast/Badge) que mencioné en la Fase 1.

¿Confirmas que avance con esto, o quieres ajustar algo primero (nombres de campos, algún dato que falte, etc.)?
