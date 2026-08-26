# Fase 1 — Análisis del proyecto "La Mera Fábrica" antes de construir el sistema de gestión

Fecha del análisis: 25 de agosto de 2026. Inspección hecha directamente sobre el repositorio en tu máquina (`la-mera-fabrica/`), sin tocar código todavía — esto es solo el reconocimiento que pediste antes de empezar.

---

## 1. Arquitectura actual

- **Next.js 16.3.1** (versión reciente con cambios de convención — hay una nota en `AGENTS.md`/`CLAUDE.md` que advierte revisar `node_modules/next/dist/docs/` antes de escribir código nuevo, porque varias APIs cambiaron respecto a lo que es "estándar" en entrenamiento). Ya está aplicada en el código existente: por ejemplo `middleware.ts` se llama ahora `proxy.ts`, y `params`/`searchParams` de las páginas se reciben como `Promise` (`const { id } = await params`).
- **React 19.2.8**, **TypeScript**, **Tailwind CSS 4** (config inline en `globals.css` con `@theme`, no `tailwind.config.js`).
- **Prisma 6.19.3** contra **PostgreSQL** (Supabase), con pooler Supavisor (`DATABASE_URL` puerto 6543 para la app, `DIRECT_URL` puerto 5432 para migraciones).
- **Supabase**: Auth (`@supabase/ssr`) para el login del panel, Storage para imágenes (dos buckets: `productos` y `contenido`), y la misma base de datos de Postgres que usa Prisma.
- **Un solo ambiente**: no hay dev/staging separados — la base de datos de Supabase que usas en `npm run dev` es la misma de producción. Esto es una decisión ya tomada del proyecto, no un descuido.
- Desplegado en **Vercel** (plan Hobby), dominio actual `la-mera-fabrica-dgn1.vercel.app` (el prompt menciona `lamerafabrica.com` como dominio de producción — si ya está conectado un dominio propio dime y lo confirmo, porque mi última verificación fue contra el subdominio de Vercel).

## 2. Funcionalidades existentes

**Sitio público:**
- Catálogo de productos (Mosaico/Moldura) con filtros (tipo, categoría, diseño, acabado, aplicación, búsqueda), paginado 16 por página.
- Ficha de producto con galería, especificaciones, calculadora de cobertura (m²/ml → piezas de mosaico), productos relacionados en carrusel.
- Carrito de cotización en `localStorage` (sin login) → formulario de cotización → envío por WhatsApp (`wa.me`, no API de negocio) + guardado en base de datos (`SolicitudCotizacion`).
- Contenido editable: banners, FAQ, testimonios, sección "Nosotros", configuración del negocio (WhatsApp, horario, dirección, redes).
- SEO (sitemap, robots, structured data), Google Analytics opcional.
- Responsivo para teléfono, con un pase de amigabilidad para adultos mayores ya aplicado (texto mínimo 14px, botones táctiles ≥44px, etc.).

**Panel admin (`/admin`):**
- Login con Supabase Auth.
- CRUD de Productos (con imágenes, especificaciones por tipo, productos relacionados), Categorías, Contenido (banners/FAQ/testimonios/nosotros), Configuración del negocio.
- Cotizaciones: listado, detalle, cambio de estado (`NUEVA` → `CONTACTADO` → `CERRADA`), responder por WhatsApp, borrar.

Todo esto seguirá funcionando igual — el sistema de gestión que pides se agrega al lado, no lo reemplaza.

## 3. Rutas existentes

```
Público:
/                                  catálogo (home)
/productos                         redirect a / (con query string)
/productos/[slug]                  ficha de producto
/cotizacion                        carrito / formulario
/cotizacion/gracias                confirmación
/nosotros
/contacto
/preguntas-frecuentes

Admin (protegido):
/admin                             dashboard
/admin/login
/admin/productos, /nuevo, /[id]
/admin/categorias
/admin/cotizaciones, /[id]
/admin/contenido, /banners, /faq, /testimonios, /nosotros
/admin/configuracion
```

No existe todavía nada bajo `/admin/pedidos`, `/admin/clientes`, `/admin/produccion`, `/admin/empleados`, `/admin/calendario`, `/admin/inventario`, `/admin/finanzas`, `/admin/reportes`, ni `/estado-pedido` — son 100% nuevos, sin riesgo de choque de nombres.

## 4. Sistema de autenticación actual

- `src/proxy.ts` (el reemplazo de `middleware.ts` en Next 16) corre en casi todas las rutas y llama a `updateSession()` en `src/lib/supabase/proxy.ts`, que refresca la cookie de sesión de Supabase y redirige a `/admin/login` si no hay sesión válida en una ruta `/admin/*`.
- Cada Server Action de `/admin` vuelve a validar la sesión por su cuenta con `requireAdmin()` (`src/lib/supabase/requireAdmin.ts`) — defensa en profundidad, porque una Server Action es un endpoint invocable directo, no solo algo detrás de la navegación protegida por el proxy.
- Existe el modelo `AdminUsuario` en el schema (rol único `ADMIN` por ahora, con el campo `rol` ya listo para más roles a futuro) pero **hoy no es obligatorio tener una fila ahí para entrar** — el proxy solo exige una sesión válida de Supabase. Es una decisión deliberada de la Fase 1 original, documentada en el propio código.
- Este patrón (`requireAdmin()` primero en cada Server Action nueva) es el que voy a seguir para todo el módulo de gestión — pedidos, producción, inventario, finanzas, etc.

## 5. Estado actual de Prisma

- Sí existe `prisma/migrations/` (a diferencia de lo que yo tenía anotado de una sesión anterior) con 2 migraciones ya aplicadas: `20260816201143_init` y `20260816223347_cantidad_opcional`. El flujo real es `prisma migrate dev` en tu máquina contra la base de datos real (no hay ambiente separado de staging), así que cualquier migración nueva se aplica directo a producción.
- El schema actual (`prisma/schema.prisma`) ya tiene exactamente los modelos que mencionas: `Categoria`, `Producto`, `ImagenProducto`, `ProductoRelacionado`, `SolicitudCotizacion`, `ItemCotizacion`, `Banner`, `SeccionContenido`, `Faq`, `Testimonio`, `Configuracion`, `AdminUsuario` — con nomenclatura en español, `cuid()` como id, `creadoEn`/`actualizadoEn`, y `@@map` a snake_case para las tablas. Voy a seguir exactamente este mismo estilo en los modelos nuevos.
- `Producto` hoy **no tiene precio** — hay que agregarlo (`precioActual Decimal(10,2)?`), y es coherente con lo que pides: nunca se debe usar directo en un pedido, cada `ItemPedido` congela su propio `precioUnitario`.
- Patrón ya establecido para valores JSON opcionales: usar `Prisma.DbNull` en vez de `null` al escribir un campo `Json?` (aprendido de un bug real que solo aparecía en el build de Vercel, no en desarrollo) — lo voy a respetar si algún modelo nuevo necesita un campo JSON.

## 6. Modelos nuevos necesarios

Manteniendo el estilo exacto del schema actual (español, `cuid()`, Decimal con precisión para dinero, snapshots históricos donde corresponde):

**Pedidos**
- `Cliente` — nombre, telefono, notas, creadoEn, actualizadoEn.
- `Pedido` — codigo (único), clienteId, fechaPrometida, fechaEntregaReal, porcentajeAnticipo (Decimal), montoAnticipo (Decimal), montoTotal (Decimal), saldoPendiente (Decimal), estado (`EstadoPedido`), notas, creadoEn, actualizadoEn.
- `ItemPedido` — pedidoId, productoId, cantidad, precioUnitario (**snapshot**), subtotal, más categoria/diseño/color copiados del producto al momento de crear el pedido (no como relación viva).
- `HistorialEstadoPedido` — pedidoId, estado, fecha, **adminUsuarioId** (quién hizo el cambio, no solo "un admin" — como pediste explícitamente), notas.
- `RegistroRiego` — pedidoId, fecha, adminUsuarioId, observacion.
- Enum `EstadoPedido`: los 10 estados que listaste (`PEDIDO_RECIBIDO` … `CANCELADO`).

**Empleados y producción**
- `Empleado` — nombre, telefono, activo, notas, fechaIngreso.
- `PagoUnitarioProducto` — productoId (único), monto (Decimal) — el valor *actual* configurable por producto/diseño.
- `RegistroProduccion` — fecha, empleadoId, productoId, cantidadProducida, pagoUnitario (**snapshot**, copiado de `PagoUnitarioProducto` al momento del registro), totalGanado, unidadesDefectuosas, notas.
- `RegistroMezcla` — empleadoId, fecha, monto (**snapshot** del valor configurable), notas.
- `TipoPagoExtra` — catálogo configurable (ej. "Cargar camión") con descripción y monto sugerido.
- `PagoExtraEmpleado` — empleadoId, fecha, descripcion (copiada, no relación viva), monto (**snapshot**), notas.
- `PagoEmpleado` — empleadoId, semanaInicio/semanaFin, totales (producción + mezcla + extras), estado (`PENDIENTE`/`PAGADO`), fechaPago, notas.
- Para el monto de mezcla configurable (hoy L.130), en vez de crear una tabla de configuración nueva, propongo agregar el campo a la fila única `Configuracion` que ya existe (`montoMezclaActual`) — es exactamente el patrón que ya usas ahí (WhatsApp, horario, etc.) y evita duplicar el concepto de "fila de configuración global".

**Inventario**
- `Proveedor` — nombre, telefono, notas, activo.
- `MaterialInventario` — nombre, unidadMedida, cantidadActual, cantidadMinima, costo, proveedorId, activo, notas.
- `MovimientoInventario` — materialId, tipo (`ENTRADA`/`SALIDA`), cantidad, fecha, proveedorId (si aplica), costo, referencia, motivo, notas. Salidas manuales, como pediste (sin descuento automático por producción).
- `Compra` — proveedorId, fecha, montoTotal, notas (agrupa uno o más `MovimientoInventario` de tipo entrada).

**Finanzas**
- `Ingreso` — categoria (`VENTA`/`ANTICIPO`/`PAGO_FINAL`/`OTRO`), monto, fecha, pedidoId (opcional, para trazabilidad), descripcion.
- `Gasto` — categoria (materiales/empleados/combustible/electricidad/agua/mantenimiento/transporte/reparaciones/otros), monto, fecha, descripcion, notas.

**Mensajería**
- `PlantillaMensaje` — clave (confirmación, fecha asignada, listo, recordatorio, entregado), cuerpo con marcadores (`[NOMBRE]`, `[CODIGO]`, `[LINK_TRACKER]`, `[FECHA]`), activo.

**Un punto para decidir en la Fase 2** (no lo resuelvo solo porque cambia el diseño del schema): tu lista de modelos incluye `Entrega` como modelo separado, pero sus campos (fecha prometida, fecha real, estado, notas) ya viven en `Pedido`. Para no duplicar el mismo dato en dos tablas, te propongo dos caminos — **(a)** no crear `Entrega` como tabla aparte y manejar todo desde los campos que ya tiene `Pedido` + su historial de estados, o **(b)** crear `Entrega` solo si en el futuro un pedido puede tener múltiples entregas parciales. Con lo que describiste (una entrega por pedido) me inclino por (a), pero te lo dejo para confirmar antes de tocar el schema.

## 7. Relaciones entre modelos

- `Cliente` 1—N `Pedido`.
- `Pedido` 1—N `ItemPedido`, 1—N `HistorialEstadoPedido`, 1—N `RegistroRiego`.
- `ItemPedido` N—1 `Producto` (igual que `ItemCotizacion` hoy — sin cascada de borrado, para no perder historial si un producto se elimina).
- `HistorialEstadoPedido` N—1 `AdminUsuario`, `RegistroRiego` N—1 `AdminUsuario`.
- `Producto` 1—1 `PagoUnitarioProducto` (opcional).
- `Empleado` 1—N `RegistroProduccion`, 1—N `RegistroMezcla`, 1—N `PagoExtraEmpleado`, 1—N `PagoEmpleado`.
- `RegistroProduccion` N—1 `Producto`.
- `Proveedor` 1—N `MaterialInventario`, 1—N `Compra`.
- `MaterialInventario` 1—N `MovimientoInventario`.
- `Compra` 1—N `MovimientoInventario` (opcional, para agrupar entradas de una misma compra).
- `Ingreso` N—1 `Pedido` (opcional).

Ninguna de estas relaciones toca los modelos existentes del catálogo salvo `Producto`, que gana relaciones nuevas (`itemsPedido`, `pagoUnitario`, `registrosProduccion`) además del campo `precioActual` — son cambios aditivos, no rompen nada de lo que ya funciona.

## 8. Archivos que modificaría

- `prisma/schema.prisma` — agregar los modelos/enums nuevos y el campo `precioActual` en `Producto`. No se toca ni se borra nada existente.
- `src/lib/types.ts` — agregar los tipos/enums nuevos, siguiendo el mismo patrón manual que ya usas (no generados de Prisma).
- `src/app/admin/(protected)/layout.tsx` — ampliar `ENLACES_NAV` con los nuevos módulos (Pedidos, Clientes, Producción, Empleados, Calendario, Inventario, Finanzas, Reportes) y adaptar la navegación para que siga siendo usable en móvil con tantos enlaces (hoy usa scroll horizontal, que ya no alcanza con ~12 enlaces — probablemente convenga un sidebar real en desktop + un menú tipo "más" en móvil, como ya anticipa tu pedido).
- `src/app/admin/(protected)/page.tsx` — el dashboard actual, para incorporar las métricas nuevas (ventas del mes, pedidos activos, entregas de hoy, etc.) junto a lo que ya muestra.
- `src/app/admin/(protected)/productos/ProductoForm.tsx` y `actions.ts` — agregar el campo de precio de venta actual.

## 9. Archivos nuevos que crearía

Por módulo (siguiendo el mismo patrón que ya usa el proyecto: carpeta con `page.tsx` + `actions.ts` + subrutas `[id]`/`nuevo` donde aplique):

- `src/app/admin/(protected)/clientes/…`, `pedidos/…` (incluye vista de cola por orden de llegada), `produccion/…`, `empleados/…`, `calendario/…`, `inventario/…` (materiales, movimientos, proveedores, compras), `finanzas/…` (ingresos, gastos, reportes).
- `src/app/(public)/estado-pedido/page.tsx` y `estado-pedido/[codigo]/page.tsx` — el tracker público, con su propio diseño (no debe parecer panel admin, como pediste).
- Librerías nuevas: generación de código de pedido con reintento ante colisión (mismo patrón que ya usa `generarSlugUnico` en productos), utilidades de fecha en zona horaria de Honduras (para días de secado y cola de pedidos), armado de mensajes de WhatsApp a partir de `PlantillaMensaje` (reutilizando `buildWhatsAppUrl` de `src/lib/whatsapp.ts`, que ya existe y sirve tal cual).
- Un pequeño kit de componentes de UI compartido para el panel (Tabs, Modal, Toast, Badge de estado) — hoy el panel no tiene ninguno de estos, cada pantalla usa HTML/Tailwind directo. Con ~12 módulos nuevos conviene construir esto una sola vez al principio en vez de repetir estilos sueltos en cada pantalla.

No voy a inventar el listado archivo-por-archivo completo (serían 60-80 archivos) hasta la Fase 2, donde primero cerramos el diseño del schema — así evito recalcularlo si algo cambia ahí (como la decisión de `Entrega` del punto 6).

## 10. Riesgos de romper funcionalidades existentes

- **Bajo riesgo en general**: todos los modelos nuevos son aditivos (tablas y columnas nuevas), no se toca ningún modelo, campo o relación existente salvo agregar `precioActual` a `Producto` (nullable, no rompe nada que ya lea ese modelo).
- **Migración contra producción directa**: como no hay ambiente de staging, la migración de Prisma se aplica a la base de datos real. Es de bajo riesgo por ser aditiva, pero igual conviene hacerla en un momento de poco tráfico y, si tu plan de Supabase lo permite, confirmar que haya un punto de restauración reciente antes de correrla.
- **Navegación del panel**: hoy el nav admin usa una sola fila con scroll horizontal, pensada para 6 enlaces — con ~12 no va a alcanzar igual de bien y hay que rediseñarla (sidebar en desktop es justo lo que pediste). Es un cambio visible pero acotado a un archivo.
- **Convenciones de Next.js 16**: como el propio proyecto advierte, hay diferencias de API frente a lo "estándar" — voy a seguir revisando `node_modules/next/dist/docs/` antes de escribir rutas/Server Actions nuevas, igual que ya se hizo en el código existente (`params` como `Promise`, `proxy.ts` en vez de `middleware.ts`).
- **Zona horaria**: Vercel corre en UTC por defecto — los cálculos de "días de secado" y el orden de la cola de pedidos necesitan conversión explícita a hora de Honduras (UTC-6), no se puede confiar en la hora del servidor. Lo marco como riesgo porque es un error fácil de introducir sin querer si un cálculo de fecha nuevo no pasa por ese helper.

## 11. Plan de implementación

Voy a seguir el orden de fases que planteaste, con un ajuste: meto el kit de componentes de UI compartido (Tabs/Modal/Toast/Badge) al principio de la Fase 3 en vez de dejarlo para el pulido final (Fase 10), porque todos los módulos posteriores lo van a necesitar y así no repito estilos sueltos módulo por módulo.

1. **Fase 2** — Diseñar la extensión completa de `schema.prisma` (con la decisión de `Entrega` ya resuelta) y revisarla contigo antes de migrar.
2. **Fase 3** — Clientes, Pedidos, Items, Estados, Historial (con el código único, la cola por orden de llegada, y el kit de UI base).
3. **Fase 4** — Tracker público `/estado-pedido`.
4. **Fase 5** — Producción, Empleados, Mezcla, Extras, Pagos semanales.
5. **Fase 6** — Inventario, Proveedores, Compras, Movimientos.
6. **Fase 7** — Calendario, Entregas, Secado, Riego.
7. **Fase 8** — Finanzas, Gastos, Ingresos, Reportes.
8. **Fase 9** — WhatsApp, Plantillas, Mensajes.
9. **Fase 10** — Pulido general: responsive, validaciones, estados vacíos, loading, errores.

Después de cada fase corro `npm run lint` y `npm run build` (y reviso `tsc`) antes de darla por terminada, igual que se hizo en todo el trabajo anterior del proyecto.

---

**Antes de arrancar la Fase 2** quisiera que me confirmes el punto del apartado 6 sobre `Entrega` (tabla aparte vs. campos ya en `Pedido`) — es la única decisión de diseño que cambia la forma del schema.
