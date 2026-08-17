# La Mera Fábrica — Propuesta de producto y arquitectura (Fase 0)

*Documento de discovery. No contiene código. Objetivo: alinear visión, alcance y arquitectura antes de construir.*

---

## 0. Antes de todo: qué encontré y qué falta

Revisé la carpeta del proyecto conectada y está vacía — no hay fotos, documentos, ni datos del negocio todavía. Eso significa que todo lo que seiga en este documento sobre WhatsApp, dirección, horarios, redes sociales o historia de la empresa **no existe aún como dato real**, y lo trato como tal: como placeholders explícitos que tú vas a llenar más adelante, no como algo que yo inventé y disfracé de real. Lo señalo de nuevo en la sección 17.

Esto no bloquea la arquitectura ni el modelo de datos — sí determina que el sistema debe tratar "falta información" como un estado de primera clase (fotos, teléfono, testimonios, historia), no como un caso excepcional que se resuelve con datos de relleno.

---

## 1. Las tres decisiones que más importan

Todo el resto de este documento es, en buena parte, consecuencia de estas tres decisiones. Si estas tres están bien, el resto se acomoda; si están mal, ningún detalle de UI las va a salvar.

**(a) El catálogo es una sola familia de producto, no dos catálogos.** Mosaico y moldura se venden juntos en la práctica — la moldura remata el piso de mosaico. Si el modelo de datos o la navegación los tratan como dos secciones separadas con lógicas distintas, vas a terminar con dos catálogos que compiten por atención en vez de complementarse, y el admin va a tener que cargar "productos relacionados" a mano sin que el sistema realmente entienda la relación. La decisión correcta es un solo modelo `Producto` con un campo `tipo` (`mosaico` | `moldura`), atributos compartidos como columnas de primera clase (estilo, acabado, color, aplicación), atributos específicos por tipo en un bloque flexible, y una relación explícita `producto_relacionado` con un campo `tipo_relacion` que distingue "moldura a juego" (complementario) de "también te puede interesar" (similar). El detalle está en la sección 9.

**(b) La cotización es el verdadero checkout de este sitio.** No hay carrito de compra con pago, pero el flujo "selecciono productos → pido cotización → hablo por WhatsApp" cumple exactamente el mismo rol que un checkout cumple en una tienda: es la única conversión que le importa al negocio. Por eso hay que diseñarlo con la misma seriedad que un carrito real — persistencia mientras el usuario navega, poder quitar/ajustar cantidades, un resumen claro antes de enviar — y no como un formulario de contacto genérico. Si este flujo es torpe, todo lo demás (fotos bonitas, filtros, SEO) pierde sentido porque el punto de conversión falla. Detalle en la sección 8.

**(c) El panel administrativo se construye a medida dentro de la misma app, no con un CMS genérico.** Consideré recomendar un CMS headless (Payload, Sanity) para ahorrar tiempo de desarrollo del admin. Lo descarté: el flujo de cotizaciones y la construcción de mensajes de WhatsApp son lógica de negocio específica que ningún CMS genérico resuelve de fábrica — terminarías construyendo esas pantallas a mano de todos modos, y mantener "una parte del admin en el CMS, otra parte custom" es más complejo que tener todo en un solo lugar. Con menos de 50 productos, el costo de construir 6-7 pantallas CRUD simples es bajo comparado con el costo de operar y aprender una pieza de infraestructura adicional. Detalle en la sección 8.

---

## 2. Visión del producto

La Mera Fábrica necesita una presencia digital que haga el trabajo que hoy probablemente hace una visita en persona o una conversación de WhatsApp fría: mostrar el catálogo con calidad suficiente para generar confianza, dejar clarísimo qué combina con qué, y llevar a la persona interesada a una conversación de WhatsApp ya con contexto (qué productos, qué cantidades) en vez de "hola, quería preguntar por sus productos". El sitio no vende directamente — vende la conversación que sí cierra la venta.

## 3. Problema que resolvemos

Un negocio de mosaicos y molduras compite, en la mente del comprador, contra otras opciones que sí muestran catálogo online con buena fotografía y navegación clara (aunque sean más caras o de menor calidad real). Sin presencia digital seria, La Mera Fábrica pierde esa primera impresión antes de que el precio o la calidad del producto entren en juego. El problema no es "no tenemos página web" — es "no tenemos manera de que alguien descubra, se enamore de un diseño, y nos escriba ya sabiendo qué quiere".

## 4. Usuarios objetivo

- **Cliente final / propietario** remodelando o construyendo, navegando desde el celular, comparando estilos, sin conocimiento técnico de materiales de piso. Quiere ver fotos grandes, entender qué combina, y no perder tiempo llenando formularios largos.
- **Maestro de obra / contratista / arquitecto** que compra para un proyecto de un cliente. Conoce la terminología técnica (m², piezas por caja, espesor), probablemente cotiza varios productos a la vez para distintos ambientes de un mismo proyecto, y valora tener specs técnicas completas.
- **Roberto (administrador único)** — dueño del negocio, sin tiempo para tocar código, necesita poder subir un producto nuevo, marcar uno como agotado, y ver qué cotizaciones llegaron, todo desde un panel simple en el celular o la computadora.

No hay un cuarto tipo de usuario "comprador recurrente con cuenta" todavía — ver sección 6 sobre por qué no construir cuentas de cliente ahora.

## 5. Funcionalidades recomendadas (resumen)

Catálogo unificado con filtros (tipo, estilo, acabado, color, aplicación), ficha de producto completa con galería y estado "sin foto" bien resuelto, productos relacionados/complementarios, selección de productos con cantidad hacia una cotización persistente, envío de cotización por WhatsApp con mensaje pre-armado, botón de WhatsApp directo por producto, panel administrativo con CRUD de productos/categorías/banners/FAQ/testimonios y bandeja de cotizaciones, SEO técnico completo (metadata, sitemap, datos estructurados sin precio), y analítica de eventos clave del embudo. La calculadora de cobertura entra después de que el resto funcione (sección 7).

## 6. Funcionalidades descartadas y por qué

- **Pagos online / carrito de compra real:** no hay precio público ni venta directa; el negocio cierra por negociación. Construir esto ahora sería resolver un problema que no existe.
- **Cuentas de cliente y favoritos con login:** con menos de 50 productos y sin compra recurrente online, pedirle a un visitante que se registre para guardar favoritos es fricción sin beneficio. Además, "favoritos" y "lista de cotización" serían dos conceptos que resuelven la misma intención del usuario ("esto me interesa") — construir los dos sería redundante. La lista de cotización ya cumple ese rol.
- **Comparador de productos lado a lado:** tiene sentido en catálogos de cientos de SKUs con specs muy diferenciadas. Con un catálogo pequeño y curado, abrir dos pestañas de producto ya resuelve la comparación; es complejidad de UI que no se paga sola todavía.
- **Reseñas/calificaciones abiertas tipo e-commerce:** sin compra online verificable, esto es puro riesgo de spam y moderación sin beneficio real. Los testimonios curados por el admin (sí incluidos) dan la misma prueba social sin ese riesgo.
- **Chat en vivo o chatbot propio:** WhatsApp ya es el canal de conversación directa del negocio. Un chat adicional compite con el canal que realmente quieres usar y agrega mantenimiento.
- **Multi-idioma:** el mercado es local hondureño. La arquitectura (rutas de Next.js) no impide agregarlo después si el negocio empieza a exportar.
- **Integración con Google Maps:** *no descartada, condicionada.* Si hay un local/showroom físico que la gente visita, un mapa embebido es barato y ayuda a SEO local y confianza. No la incluyo en el MVP porque no tengo confirmada una dirección real todavía (ver sección 17).

## 7. La calculadora: si aporta valor, y cuándo

Sí aporta valor, pero como herramienta de dos salidas a partir de una sola medición — no como dos calculadoras separadas. El usuario da largo y ancho del ambiente (y opcionalmente el % de desperdicio); el sistema calcula:

- **Mosaico:** área = largo × ancho; área con desperdicio = área × (1 + %desperdicio). Si el producto elegido tiene "cobertura por caja" cargada en el admin, se muestra también cuántas cajas comprar (redondeando hacia arriba).
- **Moldura:** perímetro = 2 × (largo + ancho), con una nota visible para que el usuario reste manualmente vanos de puertas u otras aberturas que no llevan remate. Longitud total con desperdicio = perímetro ajustado × (1 + %desperdicio). Si el producto tiene "longitud por pieza" cargada, se muestra cuántas piezas comprar.

El riesgo real no es el cálculo — es que alguien lo tome como cifra exacta, compre esa cantidad, y le falte o le sobre material. Por eso el resultado siempre se presenta como estimación ("aproximado, confirma con nosotros antes de comprar"), nunca como cantidad final, y el resultado se puede enviar directo a la cotización — ahí es donde de verdad se resuelve la precisión, con una persona real revisando.

Dicho esto: no es parte del flujo mínimo de conversión. Alguien puede pedir cotización sin usar la calculadora — puede describir el ambiente en el mensaje o pedir que se lo ayuden a calcular por WhatsApp. Por eso coincido con dejarla en la Fase 6, como está en tu roadmap: es una herramienta de valor agregado y de generación de leads, no un bloqueador del MVP.

## 8. Sistema de cotización y WhatsApp

El flujo es: el usuario agrega productos con cantidad a una "lista de cotización" (persistida en el navegador mientras no la envía, para que no se pierda si sigue navegando), la revisa, opcionalmente agrega su nombre/teléfono, y presiona "Solicitar cotización por WhatsApp". Eso hace dos cosas a la vez: guarda la solicitud en la base de datos (para que quede en el panel, con estado nueva/contactado/cerrada) y abre WhatsApp con un mensaje pre-armado que lista cada producto con su cantidad y unidad correcta (m² para mosaico, metros lineales para moldura), sin que el usuario tenga que escribir nada de eso a mano.

El mismo patrón aplica al botón "Consultar por WhatsApp" de una ficha de producto individual: arma el mensaje con nombre y código del producto automáticamente. La razón de guardar también en base de datos, y no depender solo del mensaje de WhatsApp, es que un mensaje de WhatsApp se puede perder entre chats — un registro en el panel no.

## 9. Catálogo y modelo de datos

Entidad central: **Producto**, con `tipo` (mosaico | moldura) como discriminante. Comparten como columnas propias: nombre, SKU, categoría/estilo, acabado, colores, aplicaciones recomendadas, disponibilidad, destacado (sí/no), descripción, galería de imágenes (0 o más — 0 imágenes es un estado válido, resuelto con un placeholder de marca por categoría, no un ícono roto). Las especificaciones que sí difieren por tipo (dimensiones de pieza y cobertura por caja en mosaico; longitud de pieza y perfil en moldura) viven en un bloque de datos técnicos flexible asociado al producto, para no forzar un esquema rígido compartido que no aplica igual a ambos tipos, ni tener que migrar la base de datos cada vez que aparece un atributo técnico nuevo.

**Producto relacionado** es una relación propia (no un campo de texto libre) con un tipo: `complementario` (la moldura que combina con este mosaico, y viceversa) o `similar` (otro producto parecido). Esto es lo que hace posible mostrar "Moldura a juego" en la ficha de un mosaico como una sección con peso propio, distinta de "también te puede interesar".

**Categoría** es la taxonomía de navegación (p. ej. estilo o colección de diseño), compartida entre mosaicos y molduras — así un filtro por estilo funciona igual para ambos tipos de producto.

**Cotización** (solicitud) tiene sus propios datos de cliente y estado, y una lista de ítems (producto, cantidad, unidad). **Configuración global** (número de WhatsApp, horario, dirección, redes sociales) vive en una tabla editable desde el panel — nunca hardcodeada, precisamente porque hoy no tengo esos datos reales y no deberían quedar clavados en el código el día que los tengas.

Contenido editable adicional: banners, secciones de "quiénes somos" con soporte de placeholder cuando falte historia o fotos reales, FAQ, y testimonios (sección que simplemente no se muestra si no hay ninguno real cargado — nunca con testimonios de relleno).

Precio: no existe como campo público. El modelo de datos puede tener un campo de precio interno a futuro (por ejemplo para uso interno del admin), pero eso es una decisión para cuando decidas mostrar precios, no algo que construyo ahora sin necesidad.

## 10. Arquitectura de páginas (navegación)

Inicio → propuesta de valor + destacados + acceso directo a "Mosaicos" y "Molduras". Catálogo (con filtro por tipo, estilo, acabado, aplicación) → Ficha de producto (galería, specs, disponibilidad, moldura a juego, similares, botón WhatsApp, "agregar a cotización") → Mi cotización (lista seleccionada, editar cantidades, enviar por WhatsApp). Además: Nosotros, Preguntas frecuentes, Contacto (con WhatsApp y, si aplica, mapa). La calculadora vive dentro del flujo de producto/cotización, no como una página aislada y desconectada.

## 11. Panel administrativo (arquitectura)

Login de un solo administrador (email/contraseña), con el modelo de permisos ya pensado para admitir roles adicionales después sin rehacer la autenticación (un campo de rol en el usuario admin, aunque hoy solo exista un valor posible). Secciones: Productos (CRUD, imágenes, destacar, activar/desactivar), Categorías (CRUD, orden), Cotizaciones (bandeja con filtro por estado, detalle de cliente y productos solicitados), Contenido (banners, sección Nosotros, FAQ, testimonios), y Configuración (WhatsApp, horario, dirección, redes — los datos que hoy son placeholders).

## 12. Flujos principales del usuario

**Descubrimiento → interés → cotización:** entra al catálogo, filtra por estilo, abre un mosaico que le gusta, ve la moldura a juego sugerida, agrega ambos a su cotización con las cantidades que necesita, revisa el resumen, y envía por WhatsApp — todo sin escribir una lista a mano.

**Consulta rápida:** entra directo a un producto (por ejemplo desde una búsqueda de Google), no quiere cotizar todavía, solo pregunta por WhatsApp con un toque — el mensaje ya trae el nombre del producto.

**Gestión diaria del admin:** sube un producto nuevo desde el celular con un par de fotos (o ninguna, si no las tiene todavía), revisa si llegó alguna cotización nueva, y marca las que ya atendió.

## 13. Propuesta UX/UI

Dirección visual: materiales y calidez por encima de "tienda de construcción genérica". Paleta de neutros cálidos (terracota, arena, gris piedra, negro carbón) con un acento sobrio anclado en el producto físico (óxido/terracota), evitando el azul corporativo genérico de sitios de materiales de construcción. Tipografía con contraste intencional: una sans geométrica y limpia para interfaz y lectura (funcional, moderna), combinada con una fuente de titulares con más carácter (para transmitir oficio y tradición sin caer en "rústico" torpe). Fotografía grande y protagonista cuando exista; mientras no exista, un placeholder propio de marca (patrón geométrico sutil que evoca líneas de mosaico, en la paleta de la marca, con el nombre del producto) — nunca un ícono de imagen rota ni un cuadro gris vacío. Mobile-first porque la mayoría de este tráfico va a llegar desde el celular. Microinteracciones mínimas y con propósito (confirmación al agregar a cotización, no animaciones decorativas). Sin gradientes, sin glassmorphism, sin exceso de elementos — la fotografía y los materiales son el elemento visual, no el chrome de la interfaz.

## 14. Estrategia de SEO

Metadata única por página, URLs amigables por producto y categoría, Open Graph con imagen (o el placeholder de marca si no hay foto), sitemap.xml y robots.txt generados automáticamente. Datos estructurados: `Product` (sin `offers`/precio — decisión deliberada, no omisión por descuido) para no reportar a Google datos de precio inexistentes o falsos, que además arriesga penalización por datos estructurados inválidos; `LocalBusiness` con la información real del negocio en cuanto exista (Nacaome, Valle, Honduras), y `FAQPage` para las preguntas frecuentes. Contenido orientado a las búsquedas reales del negocio (mosaicos para piso, molduras para piso, revestimientos, remates de piso, Nacaome, Valle, Honduras) integrado de forma natural en títulos, descripciones y el texto de cada ficha — no relleno de palabras clave.

## 15. Estrategia de analítica

Los eventos que importan son los que marcan el embudo real: producto visto, producto agregado a cotización, cotización enviada, clic en WhatsApp (por producto y desde cotización), búsqueda realizada, filtro/categoría usada, calculadora usada (cuando exista). La manera más simple y de costo cero es Google Analytics 4 con eventos personalizados (`gtag`) — estándar, sin infraestructura adicional. La cotización enviada en sí ya queda registrada con detalle completo en la base de datos (no necesita analítica externa para eso) — GA4 es para entender el comportamiento *antes* de que alguien decida cotizar.

## 16. Arquitectura técnica y stack

Recomiendo una sola aplicación **Next.js (TypeScript, App Router)** que sirve tanto el sitio público como el panel administrativo — un solo código, un solo despliegue, razonable para un desarrollador solo manteniendo esto. Base de datos **PostgreSQL** con **Prisma** como ORM (tipado fuerte, migraciones controladas, y el modelo relacional de la sección 9 encaja naturalmente en tablas). Para no sumar servicios innecesarios, recomiendo **Supabase** en su capa gratuita para tres cosas a la vez: la base de datos Postgres, autenticación del admin (email/contraseña, con campo de rol para el futuro), y almacenamiento de imágenes — un solo proveedor en vez de tres, lo cual importa cuando quien mantiene esto eres tú. Hosting en **Vercel** (capa gratuita), nativo para Next.js, con optimización automática de imágenes (relevante porque vas a ir subiendo fotos reales con el tiempo) y despliegue directo desde git.

Evalué y descarté un CMS headless (Payload/Sanity) para el admin por lo explicado en la sección 1(c). Evalué Cloudinary para imágenes y lo descarté por ahora: sumaría un cuarto proveedor cuando Supabase Storage + la optimización de imágenes de Vercel ya cubren la necesidad real a esta escala, sin costo.

Sobre presupuesto: esta combinación (Vercel + Supabase, capas gratuitas) cubre cómodamente el tráfico y volumen de datos de un catálogo de menos de 50 productos con un solo administrador. Los límites gratuitos de ambos (ancho de banda, almacenamiento, filas de base de datos) son generosos para esta escala — si el negocio crece mucho en tráfico, son límites que se resuelven subiendo de plan, no rehaciendo la arquitectura.

WhatsApp: enlaces `wa.me` con texto pre-codificado, sin API de negocio ni costo — construidos en el cliente a partir de los datos de producto/cotización, tal como pediste.

## 17. Riesgos y decisiones importantes

**Información real pendiente (no inventada, no bloqueante para aprobar arquitectura):** número de WhatsApp del negocio, dirección/showroom físico (si existe), horario de atención, redes sociales, historia real de la empresa, y por supuesto fotografía de producto. Nada de esto detiene la Fase 0-3; sí es necesario antes de que el sitio se sienta "terminado" en la Fase 4. Te lo voy a pedir de forma puntual cuando lleguemos ahí, no antes.

**Riesgo de la cotización sin seguimiento:** guardar la solicitud en base de datos no sirve de nada si nadie la revisa. El panel debe hacer obvio, no opcional, cuándo hay una cotización nueva sin atender.

**Riesgo de placeholders mal resueltos:** si el placeholder de "sin foto" se ve descuidado, comunica lo contrario de lo que este proyecto busca transmitir. Vale la pena invertir tiempo de diseño ahí específicamente, no tratarlo como un caso menor.

**Riesgo de sobre-alcance en el panel:** es tentador construir un CMS completo de bloques flexibles para cada sección de contenido. Para un solo administrador y un catálogo pequeño, formularios directos y específicos por sección (banner, FAQ, testimonio) son más rápidos de construir, más fáciles de usar sin capacitación, y suficientes.

## Roadmap

El roadmap que planteaste ya está bien pensado — fusionar catálogo público y panel de productos en una sola fase (2) es correcto por la misma razón que ya diste: no tiene sentido un catálogo que solo se edita tocando código. No encontré, en este análisis, una razón concreta para reordenarlo. Lo confirmo tal como está: Fase 0 (este documento) → Fase 1 (fundación técnica + auth) → Fase 2 (catálogo + panel de productos) → Fase 3 (cotización) → Fase 4 (contenido y confianza) → Fase 5 (SEO y analítica) → Fase 6 (calculadora y optimización).

---

Con esto detengo el análisis. No he escrito código todavía, como pediste. Quedo atento a tu revisión antes de arrancar la Fase 1 — y si algo de esto (sobre todo las tres decisiones de la sección 1) no te convence, prefiero que lo discutamos ahora que después de tener código construido encima.
