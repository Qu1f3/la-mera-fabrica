# Propuesta — Modo sin conexión (offline) con sincronización

Fecha: 3 de septiembre de 2026. Escrito después de revisar el código real del panel (`public/sw.js`, `prisma/schema.prisma`, `pedidoCodigo.ts`, `auditoria.ts`, `requireAdmin.ts`) — esto es el análisis antes de tocar código, como se hizo en `analisis-fase1-sistema-gestion.md`.

Contexto acordado con Roberto: son dos dispositivos (Roberto como dueño, su mamá como empleada), ambos necesitan poder **ver y registrar** durante un corte de luz/internet, y ante un choque real (los dos editaron lo mismo sin señal al mismo tiempo) el sistema debe avisar y dejar que la persona decida manualmente cuál versión se queda — no resolverlo solo. Alcance elegido para empezar: **Producción, Extras, Pedidos e Inventario**.

---

## 1. Qué significa "offline" acá (y qué no)

Esto no es "el panel funciona igual con o sin internet, en tiempo real, para siempre". Es: si se corta la luz o el internet del local, las pantallas elegidas siguen abriendo con la última información que tenían, se puede seguir registrando cosas, y apenas vuelve la señal, todo se sincroniza solo contra la base real — avisando si hay algo que decidir a mano.

Hoy el panel es 100% dependiente de conexión: cada pantalla se renderiza en el servidor contra Supabase, y el `public/sw.js` actual **deja dicho en su propio comentario** que NO cachea nada a propósito, porque mostrar datos viejos (pedidos, inventario) como si fueran actuales es peligroso — ese comentario ya anticipa este trabajo, así que no es un choque con lo que hay, es completar lo que se dejó pendiente.

## 2. Buenas noticias del código actual

Revisando el schema y la lógica existente, el sistema ya está construido de una forma bastante amigable para esto, sin que fuera el objetivo original:

- **Todos los IDs son `cuid()`** (no números autoincrementales). Un `cuid` se puede generar en el navegador sin tocar el servidor y prácticamente nunca choca — así que un registro creado sin conexión ya nace con su ID final, sin necesitar "reemplazar el ID" después al sincronizar.
- **El código de pedido (`pedidoCodigo.ts`) ya es aleatorio**, no secuencial (8 caracteres de un alfabeto de 31 símbolos, con chequeo de colisión). Igual de fácil de generar sin conexión.
- **Casi todo lo que se registra en Producción, Extras e Inventario es "crear algo nuevo"**, no editar un registro existente: un `RegistroProduccion`, un `PagoExtraEmpleado`, un `MovimientoInventario` son entradas de una bitácora, no algo que dos personas modifiquen a la vez. Eso significa que ahí **casi no hay riesgo real de choque**, sin importar que las dos personas estén registrando cosas al mismo tiempo sin señal.
- **El stock de Inventario (`MaterialInventario.cantidadActual`) se puede sincronizar como "sumar/restar" en vez de "fijar un número"**: cada `MovimientoInventario` ya guarda su cantidad como una entrada/salida (un delta), no un total. Si la sincronización aplica cada movimiento pendiente como "sumale esto al valor que esté en el servidor en ese momento" (no "el stock final debe quedar en X"), dos movimientos hechos sin señal en los dos dispositivos se suman solos sin chocar nunca, incluso si fueron sobre el mismo material.

## 3. Dónde sí hay riesgo real de choque

El punto delicado es **editar el mismo Pedido ya existente** desde los dos dispositivos mientras ambos están sin señal a la vez (ej. un apagón general en el local): cambiar el estado, la fecha prometida, registrar un riego o una entrega sobre el mismo pedido. Ahí es donde entra la pantalla de "esto se sobreescribió, elegí cuál se queda" que pediste — el sistema no decide solo, muestra las dos versiones y espera que alguien elija.

Crear un Pedido nuevo sin conexión no tiene este problema (por el punto 2: código e ID ya nacen sin chocar) — el riesgo es solo al **modificar uno que ya existía**.

## 4. Arquitectura propuesta (4 piezas, se construyen una vez y sirven para las 4 pantallas)

1. **Service worker real** (reemplaza el actual, que es un cascarón vacío a propósito): cachea el JS/CSS de la app y, para las 4 pantallas elegidas, la última vista cargada — para que abran aunque no haya señal.
2. **Una base local en el navegador (IndexedDB)** con una copia de lo que cada pantalla necesita mostrar.
3. **Una cola de cambios pendientes**: cada acción hecha sin señal se guarda localmente (con su ID ya generado) y se reintenta sola cuando vuelve la conexión, en orden.
4. **Un cambio necesario en cómo se guardan los datos**: hoy las pantallas usan Server Actions de Next.js, cuyo identificador interno cambia en cada despliegue nuevo. Si alguien queda sin señal y en el medio hacés un `git push` (que Vercel despliega solo), una acción encolada en ese momento podría quedar inválida al reconectar. Por eso, para estas 4 pantallas nada más, hay que agregar rutas de API "normales" y estables (`/api/...`) como puerta de entrada para las escrituras encoladas — reutilizando la misma lógica de validación/cálculo que ya existe, sin duplicarla.

Además: un indicador visible de "Sin conexión — 3 cambios pendientes" mientras dura el corte, y la pantalla de resolución manual de choques (punto 3) solo para Pedidos.

## 5. Fases de construcción

- **Fase 1 — la base** (una sola vez, sirve para las 4 pantallas): service worker real, IndexedDB, cola de sincronización, indicador de conexión. Sin esto no se puede avanzar con ninguna pantalla individual.
- **Fase 2 — Producción y Extras**: las más simples y las que eligió como más usadas — solo crean registros nuevos, sin riesgo real de choque. Buen primer entregable concreto para probar que la Fase 1 funciona de verdad (cortar el wifi, registrar producción, reconectar, ver que sincronizó).
- **Fase 3 — Inventario**: crear movimientos es igual de simple (por el punto de "sumar/restar"); hay que revisar aparte si Compras a crédito y Proveedores nuevos también deben poder crearse sin señal, o si eso se deja para cuando hay conexión.
- **Fase 4 — Pedidos**: la más delicada. Crear pedidos nuevos sin señal es fácil (punto 2), pero cambiar estado/fecha/entregas de un pedido existente es donde se necesita la pantalla de resolución manual de choques.

## 6. Qué queda fuera (por ahora) y riesgos a tener presentes

- Reportes, Pagos semanales, Proveedores y el resto del panel siguen necesitando conexión — no entraron en el alcance elegido. Se puede ampliar más adelante con el mismo patrón.
- Esto es trabajo de varias sesiones, no una sola tarde. Agregar rutas de API nuevas al lado de las Server Actions existentes hay que hacerlo con cuidado para no duplicar la lógica de negocio (reutilizar, no reescribir).
- Antes de confiar en esto para el negocio de verdad, hay que probar el escenario real: cortar el wifi de un dispositivo, hacer varias cosas, reconectar, y confirmar que todo llegó bien a la base y que la bitácora de auditoría (`RegistroAuditoria`) queda clara sobre qué se sincronizó después y qué se sobreescribió en un choque.

## 7. Próximo paso propuesto

Empezar por **Fase 1 + Fase 2 juntas** (la base + Producción/Extras): es el combo con menos riesgo real de choque, cubre dos de las cuatro pantallas elegidas, y sirve como prueba real de que el mecanismo de sincronización funciona antes de meterse con Inventario y, sobre todo, con Pedidos (que necesita la parte más delicada: la resolución manual de choques).

---

## Fase 1 + 2 — hecho (3 de septiembre de 2026)

Construidas ambas juntas, como se propuso en el punto 7. Resumen de lo que se agregó/cambió:

- **`public/sw.js`** reescrito: ya cachea de verdad (antes, a propósito, no cacheaba nada). Cache-first para el JS/CSS estático de Next.js; red-primero-con-respaldo-en-caché solo para `/admin`, `/admin/produccion`, `/admin/produccion/nuevo` y `/admin/extras` (lista en `src/lib/offline/rutas.ts`, duplicada a mano en el propio `sw.js` porque ese archivo no pasa por el build). Cualquier otra pantalla del panel sigue sin cachearse, a propósito.
- **`src/lib/offline/`**: `db.ts` (IndexedDB sin ninguna librería externa, para no depender de `npm install`), `sync.ts` (cola de sincronización: encolar, procesar en orden, reintentos), `useEstadoOffline.ts` (hook para la UI), `tipos.ts`, `rutas.ts`.
- **`src/lib/produccion/registrar.ts`** y **`src/lib/extras/registrar.ts`**: la lógica real de "crear un registro" se sacó de las Server Actions a estas dos funciones compartidas, con soporte de id/fecha opcionales para cuando el registro se sincroniza después de haberse guardado sin conexión (upsert por id -- reintentar la sincronización nunca duplica). Las Server Actions originales (`produccion/actions.ts`, `extras/actions.ts`) se dejaron funcionando, ahora como envoltorios delgados sobre esa misma lógica.
- **`/api/offline/produccion`** y **`/api/offline/extras`**: rutas de API nuevas y estables (no cambian con cada despliegue, a diferencia de una Server Action) -- son las que de verdad usan los formularios ahora, con o sin conexión.
- **`EstadoConexion.tsx`**: banner visible en todo `/admin` cuando hay algo pendiente de sincronizar o no hay señal.
- Los dos formularios (`NuevoRegistroProduccionForm.tsx`, `NuevoPagoExtraForm.tsx`) ya no usan Server Actions -- guardan con `encolarProduccion()`/`encolarExtra()`.
- Los enlaces hacia/entre las 4 rutas sin conexión (menú lateral, "+ Nuevo registro", "← Producción") pasaron de `<Link>` a `<a>` a propósito, para forzar una navegación real que el service worker sepa interceptar.

**Cambio de comportamiento a propósito:** el formulario de Producción ya NO redirige a `/admin/produccion` al guardar -- se queda en la página y limpia el formulario (mismo patrón que ya usaba Extras). Redirigir justo después de un registro hecho sin señal habría dejado a quien lo usa mirando una pantalla que no puede cargar.

**Verificado:** `npx tsc --noEmit` y `npx eslint` sin errores sobre todos los archivos nuevos/editados.

**Todavía NO probado de verdad** (necesita el navegador real -- no se puede simular desde acá): cortar el wifi del teléfono/computadora, registrar producción y un pago extra, reconectar, y confirmar que ambos llegan a la base y que la bitácora de auditoría queda clara. Recomiendo probar esto en al menos un dispositivo antes de confiar en esto para el negocio de verdad -- y para que valga la prueba, hay que haber abierto `/admin/produccion/nuevo` y `/admin/extras` con conexión al menos una vez primero (así el service worker ya tiene una copia guardada de esas páginas).

**Limitación conocida:** si el pago por unidad de un producto se cambia (algo que solo hace el ADMIN, raro) justo mientras hay un registro de producción pendiente de sincronizar sin conexión, ese registro se paga con la tarifa vigente al momento de sincronizar, no la de cuando se registró -- no se guardó una copia del pago unitario en el dispositivo para este alcance. En la práctica, con dos personas y una tarifa que casi no cambia, el riesgo real es mínimo.

**Pendiente:** Fase 3 (Inventario) y Fase 4 (Pedidos, con la pantalla de resolución manual de choques) quedan para después de confirmar que esto funciona bien en uso real.

---

## Fase 3 — hecho (3 de septiembre de 2026, mismo día)

Solo **registrar un movimiento de inventario** (entrada/salida, opcionalmente como compra a un proveedor, opcionalmente a crédito) quedó sin conexión -- es la acción de bitácora de uso diario, igual que Producción/Extras. Quedaron a propósito FUERA de este alcance (siguen necesitando conexión, como antes): crear/editar un material, marcar una compra a crédito como pagada, borrar un movimiento, y el CRUD de proveedores -- todas ediciones de un registro existente o tareas administrativas poco frecuentes, no algo que haga falta durante un corte.

- `/admin/inventario` se agregó a las rutas sin conexión (todo el flujo de Producción vive en un modal de esa única página -- no hizo falta una ruta `/nuevo` aparte como en Producción).
- `src/lib/inventario/registrar.ts`: lógica compartida, con una vuelta extra respecto a Producción/Extras -- un movimiento SÍ tiene un efecto secundario (ajusta `MaterialInventario.cantidadActual`, y si es una compra pagada de una vez, crea un `Gasto`). Un simple upsert-por-id no alcanza ahí: si se reintenta la sincronización de un movimiento ya aplicado, hay que evitar sumar el stock dos veces. La función ahora primero revisa si el `idMovimiento` ya existe -- si existe, es un reintento y no hace nada más (no-op); solo si no existía hace el trabajo real (crear compra/gasto/movimiento + ajustar stock). Esto no hacía falta en Producción/Extras porque esos registros no tienen ningún efecto sobre otro dato.
- La comprobación de "no dejar el stock en negativo" sigue viviendo 100% en el servidor, contra el stock real en el momento exacto en que el movimiento se aplica (con conexión, al instante; sin conexión, cuando se sincroniza) -- nunca se relaja. Si un movimiento sin conexión, al sincronizarse, resulta que ya no hay stock suficiente, se queda pendiente con el error visible en el banner en vez de aplicarse igual. En el formulario se agregó un aviso -- NO bloqueante -- si según la última copia con señal ya no alcanzaría, para que quien lo usa tenga una pista, sabiendo que no es una garantía.
- Verificado con `npx tsc --noEmit` y `npx eslint` -- sin errores.

**Todavía pendiente:** Fase 4 (Pedidos, la única que necesita de verdad la pantalla de resolución manual de choques, porque es la única de las cuatro pantallas donde se edita un registro que ya existe en vez de solo crear uno nuevo).

**Nota aparte:** un `git status` de esta sesión dejó un `.git/index.lock` que no se pudo borrar solo (el entorno donde corro no puede borrar archivos sin permiso) -- ya se resolvió con tu autorización, pero si alguna vez ves un error de "Unable to create '.git/index.lock': File exists" al hacer `git add`/`commit`, es este mismo problema y se soluciona borrando ese archivo.

---

## Fase 4 — hecho (3 de septiembre de 2026, mismo día)

La más delicada de las cuatro, porque Pedidos es la única pantalla del alcance elegido donde SÍ se edita un registro que ya existe (cambiar estado, asignar fecha prometida) en vez de solo crear registros nuevos -- ahí es donde puede pasar de verdad que dos dispositivos sin conexión editen el mismo pedido y haga falta la resolución manual ("que me avise y yo decida manualmente", como pediste).

**Quedó sin conexión:**
- Crear un pedido nuevo -- con cliente existente O cliente nuevo en el mismo paso (ver más abajo).
- Cambiar el estado de un pedido.
- Asignar la fecha prometida.
- Registrar un riego.
- Programar una entrega.
- Ver la lista de pedidos y el detalle de un pedido (con lo último que se vio con señal).

**Quedó FUERA a propósito (sigue necesitando conexión, igual que antes):** borrar un pedido, marcar/cambiar el estado de una entrega ya programada, borrar una entrega -- todas ediciones/borrados de un registro existente y poco frecuentes, no bitácora de uso diario.

### Lo nuevo

- **`src/lib/pedidos/`**: cinco archivos, uno por acción --
  - `crear.ts` (`registrarPedidoCompartido`): antes, crear un pedido con un cliente nuevo eran DOS Server Actions separadas y encadenadas (`crearClienteInline` y luego `crearPedido`), cada una un viaje aparte al servidor -- eso no puede funcionar sin conexión. Ahora las dos cosas (crear el cliente si hace falta, y crear el pedido con sus items, su primer historial y el ingreso automático del anticipo) pasan en una sola llamada, dentro de una misma transacción. Como crear un pedido sí tiene efectos secundarios (el cliente nuevo, el ingreso automático), es idempotente por `idPedido` con el mismo criterio que `inventario/registrar.ts`: revisa primero si el pedido ya existe y, si existe, no toca nada más (ni crea el cliente otra vez, ni duplica el ingreso).
  - `estado.ts` y `fecha.ts` (`cambiarEstadoPedidoCompartido`, `asignarFechaPrometidaCompartido`): estas dos SÍ pueden chocar. Usan `Pedido.actualizadoEn` como "número de versión" -- el dispositivo manda la versión que vio la última vez que cargó el pedido, y si para cuando se sincroniza ya cambió (otro dispositivo lo editó mientras este estaba sin conexión), el cambio NO se aplica a ciegas: la función devuelve un conflicto en vez de un error o un éxito silencioso. Cambiar estado además es idempotente por `idHistorial` (mismo criterio que un movimiento de inventario, porque también dispara el ingreso automático del pago final); asignar fecha no necesita eso porque no tiene ningún efecto secundario -- ahí, si la fecha que se pide ya es la que tiene el pedido, ni siquiera se compara la versión (así un reintento normal después de una sincronización exitosa nunca se ve como un choque contra sí mismo).
  - `riego.ts` y `entrega.ts`: simples, sin choque posible (solo crean), mismo patrón de upsert-por-id que Producción/Extras.
- **`/api/offline/pedidos`**, **`/pedidos/estado`**, **`/pedidos/fecha`**, **`/pedidos/riego`**, **`/pedidos/entrega`**: rutas de API nuevas y estables. Las de `estado` y `fecha` son las únicas de las 8 pantallas/acciones sin conexión que pueden responder `409` con el pedido tal como quedó en el servidor -- toda la cola sin conexión de Producción/Extras/Inventario/crear-pedido/riego/entrega nunca puede chocar así, porque esos registros solo se crean, nunca se editan.
- **`src/lib/pedidoCodigoCliente.ts`**: versión "para el navegador" de `pedidoCodigo.ts` -- genera el código de 8 caracteres del pedido sin poder consultar la base (no hay conexión), porque el código tiene que existir desde el momento en que se crea el pedido en el dispositivo. Si por una probabilidad casi nula el código chocara con uno ya existente al sincronizar, `registrarPedidoCompartido` lo detecta y genera uno nuevo verificado contra la base, un solo reintento.
- **Resolución manual de choques**: `src/lib/offline/sync.ts` ahora reconoce una respuesta `409` y, en vez de tratarla como un error cualquiera (que se reintentaría solo cada 20 segundos para siempre), marca ese item de la cola como "en conflicto" y deja de tocarlo hasta que la persona decida -- eso es justo lo que pediste ("que me avise y yo decida manualmente"), nunca se aplica ni se descarta nada solo. `ConflictosPendientes.tsx` (nuevo, aparece debajo del banner de conexión en todo `/admin`) muestra, por cada conflicto: qué intentaste cambiar vs. qué quedó en el servidor, con dos botones -- **"Aplicar mi cambio de todas formas"** (reenvía tu cambio pidiéndole al servidor que lo aplique sin volver a comparar versión) o **"Descartar mi cambio"** (tira el cambio pendiente, se queda lo que ya está en el servidor).
- **`src/lib/offline/rutas.ts` y `public/sw.js`**: ahora soportan coincidencia por prefijo además de exacta (`esRutaSinConexion`), porque el detalle de un pedido es una ruta dinámica (`/admin/pedidos/[id]`) -- no se puede listar cada URL posible de antemano. `/admin/pedidos` (lista) es exacta; `/admin/pedidos/` (prefijo) cubre el detalle y `/admin/pedidos/nuevo`.
- `NuevoPedidoForm.tsx`, `CambiarEstadoPedidoForm.tsx`, `AsignarFechaPrometidaForm.tsx`, `RegistrarRiegoForm.tsx`, `CrearEntregaForm.tsx`: ya no usan Server Actions -- guardan con `encolarPedido()`/`encolarCambioEstado()`/`encolarFechaPrometida()`/`encolarRiego()`/`encolarEntrega()`. Los enlaces relevantes (lista de pedidos, "+ Nuevo pedido", "← Pedidos") pasaron de `<Link>` a `<a>`, mismo criterio que las fases anteriores; el enlace al cliente del pedido (`/admin/clientes/...`) se dejó como `<Link>` porque Clientes no entró en el alcance sin conexión.

### Cambios de comportamiento a propósito

- **Crear pedido SÍ redirige al detalle -- pero solo si el pedido de verdad quedó guardado en el servidor al momento de crearlo.** A diferencia de Producción/Extras/Inventario (que nunca redirigen), acá vale la pena: el detalle tiene los botones para copiar el código y mandar la confirmación por WhatsApp, algo que se usa siempre después de crear un pedido. `encolarPedido()` espera el primer intento de sincronización antes de devolver el control -- si hay señal y salió bien, navega al detalle (con el mismo id que se generó en el dispositivo); si quedó pendiente (sin señal, o el servidor lo rechazó), se queda en la página y la limpia, igual que las demás.
- **Un cliente nuevo creado dentro de un pedido sin conexión no aparece en el buscador de clientes de ese mismo formulario hasta recargar la página con señal** -- antes (con las dos Server Actions encadenadas) el cliente se creaba al instante y quedaba disponible enseguida para el resto de esa sesión del formulario. Es la consecuencia directa de que ahora todo pasa junto en una sola operación que puede quedar pendiente.
- **Asignar fecha prometida sigue sin poder "vaciar" la fecha** (deja el mismo error de siempre si el campo queda vacío) -- se mantuvo igual que la Server Action original a propósito, no es parte de este cambio.

### Fuera de alcance / limitaciones conocidas

- Los conflictos de estado/fecha solo se detectan cuando SÍ hay una edición real en juego -- si los dos dispositivos casualmente ponen el mismo valor (mismo estado, misma fecha), no se trata como choque aunque la versión no coincida, porque no hay nada que decidir.
- Mientras un pedido tiene un cambio "en conflicto" pendiente de resolver, ese item deja de reintentarse solo -- si la persona nunca abre el panel para resolverlo, se queda ahí (visible en el banner) indefinidamente. No hay recordatorio aparte de eso.
- Igual que Producción con el pago por unidad: si el precio de un producto cambia justo mientras hay un pedido pendiente de sincronizar sin conexión, ese pedido usa el precio que se veía en el dispositivo al momento de armarlo (es un snapshot histórico de todas formas, igual que con conexión -- `ItemPedido.precioUnitario` siempre fue una copia, nunca se lee "en vivo").
- Verificado con `npx tsc --noEmit` y `npx eslint` sin errores nuevos (se aprovechó para también silenciar con comentarios explicados dos errores de lint preexistentes de Fase 2 sobre los `<a>` a propósito en Producción, que ya existían desde esa fase y no se habían marcado).

**Todavía NO probado de verdad** (necesita el navegador real en dos dispositivos a la vez): crear un pedido sin conexión, cambiarle el estado desde OTRO dispositivo mientras el primero sigue sin señal, reconectar el primero y confirmar que aparece el conflicto en `ConflictosPendientes.tsx` con la información correcta, y que tanto "aplicar de todas formas" como "descartar" hacen lo que dicen. Recomiendo probar este escenario de choque real (el más importante de las 4 fases) antes de confiar en esto para el negocio de verdad.

**Con esto quedan completas las 4 pantallas del alcance elegido** (Producción, Extras, Inventario, Pedidos). Lo que sigue -- si se quiere ampliar más adelante -- es el resto del panel (Reportes, Finanzas, Clientes, etc.), que a propósito se dejó fuera desde el principio.
