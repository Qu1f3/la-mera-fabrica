# La Mera Fábrica

Plataforma web de catálogo y cotización para La Mera Fábrica (mosaicos y molduras para piso). Ver `propuesta-la-mera-fabrica.md` en la raíz del proyecto para el análisis de producto y arquitectura (Fase 0) que sustenta estas decisiones.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Prisma 6 + PostgreSQL · Supabase (Auth + Storage) · Vercel (hosting).

> Nota sobre versiones: el proyecto se generó inicialmente con la última versión de Prisma (7.x), pero se fijó deliberadamente a **6.19.3** — la 7 introduce un generador y una forma de importar el cliente distintos, muy recientes, con poca documentación y comunidad todavía. Para un proyecto que vas a mantener tú, la 6.x es la opción más estable y probada hoy.

## Requisitos

- Node.js 20+ y npm.
- Un proyecto de [Supabase](https://supabase.com) (capa gratuita) — Postgres, autenticación y storage.

## Configuración inicial

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` y llena los valores con los de tu proyecto de Supabase (Project Settings → API, y Project Settings → Database → Connection string). El archivo `.env.example` explica cada variable.

   **Importante:** para `DATABASE_URL` y `DIRECT_URL` usa las cadenas del **pooler** (Supavisor), no la conexión "directa" (`db.<ref>.supabase.co`) — esa última solo resuelve por IPv6 y falla en redes o despliegues sin soporte IPv6, incluyendo Vercel. El `.env.example` ya trae el formato correcto.

3. Aplica el esquema de base de datos:

   ```bash
   npm run db:migrate
   ```

   Esto crea las tablas descritas en `prisma/schema.prisma` en tu base de datos de Supabase y genera el cliente de Prisma.

4. Crea tu usuario administrador en Supabase: en el dashboard de tu proyecto ve a **Authentication → Users → Add user**, y crea tu correo y contraseña ahí directamente (no hace falta ningún paso adicional en la base de datos para poder entrar — ver la nota en `src/lib/supabase/proxy.ts` sobre el alcance de la Fase 1).

5. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   - Sitio público: [http://localhost:3000](http://localhost:3000)
   - Panel administrativo: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Estructura del proyecto

```
prisma/schema.prisma          Modelo de datos completo (catálogo, cotizaciones, contenido, admin)
src/app/
  (public)/                   Sitio público (catálogo como inicio, ficha de producto)
    layout.tsx                 Header/footer públicos + botón de WhatsApp (si está configurado)
    page.tsx                   Página principal: catálogo con filtros (tipo, estilo, acabado, aplicación) + banners y testimonios si existen
    productos/page.tsx          Solo redirige a "/" (conserva enlaces viejos a "/productos", con o sin filtros)
    productos/[slug]/page.tsx   Ficha de producto: galería, specs, relacionados, WhatsApp, agregar a cotización
    cotizacion/page.tsx          Carrito de cotización: revisar items, datos del cliente, enviar
    cotizacion/gracias/          Confirmación cuando aún no hay WhatsApp configurado
    nosotros/page.tsx            Historia del negocio (placeholder honesto si aún no la llenaste)
    preguntas-frecuentes/         FAQ pública
    contacto/page.tsx             Horario, dirección, mapa, redes, WhatsApp
  admin/login/                 Login del panel (público)
  admin/(protected)/            Rutas del panel que requieren sesión
    page.tsx                    Dashboard con estadísticas reales
    categorias/                 CRUD de categorías (edición en línea)
    productos/                  CRUD de productos: alta, edición, imágenes, relacionados, borrado
    cotizaciones/                 Listado y detalle de solicitudes de cotización recibidas
    contenido/                    Hub de banners, Nosotros, FAQ y testimonios
    configuracion/               Datos del negocio (WhatsApp, horario, dirección, redes)
src/components/catalogo/       Piezas de UI del catálogo público (tarjeta, galería, badge, botones de WhatsApp/cotización, calculadora de cobertura, filtros, indicador de carrito)
src/components/contenido/      Piezas de UI de contenido público (franja de banners, sección de testimonios)
src/components/admin/          Piezas de UI del panel (botón con confirmación)
src/lib/prisma.ts              Cliente de Prisma (singleton)
src/lib/supabase/client.ts     Cliente de Supabase para el navegador
src/lib/supabase/server.ts     Cliente de Supabase para Server Components / Actions
src/lib/supabase/admin.ts      Cliente con service role (solo servidor) para subir/borrar imágenes
src/lib/supabase/proxy.ts      Lógica de sesión y protección de /admin
src/lib/storage.ts             Subida/borrado de imágenes en Supabase Storage (buckets "productos" y "contenido")
src/lib/data/catalogo.ts       Consultas de solo lectura del catálogo para el sitio público
src/lib/data/contenido.ts      Consultas de solo lectura de banners/FAQ/testimonios/Nosotros
src/lib/cart/CartContext.tsx   Carrito de cotización (localStorage, useSyncExternalStore — sin backend ni cuentas)
src/lib/types.ts               Tipos compartidos del dominio (no dependen del cliente de Prisma generado)
src/lib/slug.ts                Generación de slugs
src/lib/whatsapp.ts            Construcción de enlaces wa.me y mensajes pre-armados
src/lib/site.ts                URL pública, nombre y descripción del sitio (para metadata/SEO)
src/lib/structured-data.ts     Datos estructurados schema.org (LocalBusiness, Product, FAQPage)
src/lib/analytics.ts           Envío de eventos a Google Analytics (no hace nada si no está configurado)
src/components/analytics/      Carga del script de Google Analytics (opcional)
src/app/sitemap.ts             Genera /sitemap.xml a partir del catálogo real
src/app/robots.ts              Genera /robots.txt
src/proxy.ts                   Proxy de Next.js (antes "middleware") — corre en cada request
```

### Fase 2: notas importantes

- El botón de WhatsApp (en el footer y en cada ficha de producto) **no aparece hasta que configures un número** en `/admin/configuracion`. Es intencional: sin número, no hay a dónde enviar el mensaje.
- Al subir la primera imagen de un producto, el código crea automáticamente en Supabase Storage un bucket público llamado `productos` (5 MB máx. por archivo, solo jpeg/png/webp) — no hace falta crearlo a mano.
- Los productos sin fotos muestran un placeholder de marca ("sin foto"), no un espacio en blanco ni una imagen genérica.
- El esquema de base de datos (`prisma/schema.prisma`) **no cambió** en esta fase, así que no hace falta correr `npm run db:migrate` de nuevo si ya lo corriste en la Fase 1 — solo `npm install` (por si hay dependencias nuevas) y `npm run dev`.

### Fase 3: notas importantes

- El carrito de cotización es **anónimo y vive en el navegador** (localStorage) — no hay cuentas de cliente ni login público (descartado explícitamente en la Fase 0). Se guarda en la base de datos (`SolicitudCotizacion` / `ItemCotizacion`) recién cuando el cliente envía el formulario en `/cotizacion`.
- La unidad de cada producto en la cotización (m² para mosaico, ml para moldura) no la elige el cliente — se deriva automáticamente del tipo de producto.
- Al enviar el formulario, si ya configuraste el número de WhatsApp en `/admin/configuracion`, el navegador te lleva directo a WhatsApp con el mensaje armado. Si todavía no lo configuraste, se muestra una página de confirmación simple (`/cotizacion/gracias`) — la solicitud igual queda guardada en la base de datos.
- Revisa las solicitudes recibidas en `/admin/cotizaciones`; desde el detalle de cada una puedes cambiar su estado (nueva / contactado / cerrada) y responder al cliente por WhatsApp directamente.
- **Esta vez sí hay que actualizar la base de datos**: la cantidad (m²/ml) de cada producto en una cotización ahora es opcional — un cliente puede pedir cotización sin saber todavía cuánto necesita. Eso cambió `prisma/schema.prisma` (`ItemCotizacion.cantidad` pasó de obligatorio a opcional), así que corre esto una vez:

  ```bash
  npx prisma migrate dev --name cantidad_opcional
  ```

  (No uses `npm run db:migrate` esta vez — ese script siempre nombra la migración "init", lo cual es solo un detalle estético, pero el comando de arriba deja un historial de migraciones más claro.)

### Fase 4: notas importantes

- El esquema de base de datos **no cambió** en esta fase — los modelos de banners/Nosotros/FAQ/testimonios ya existían desde la Fase 1. No hace falta correr ninguna migración nueva.
- Todo el contenido de esta fase se carga desde `/admin/contenido` y **no viene con nada de relleno**: si no agregas banners, no aparece la franja de banners en el inicio; si no agregas testimonios, no aparece esa sección; si no llenas "Nosotros" o las FAQ, esas páginas muestran un aviso honesto en vez de texto inventado. Esto es intencional (ver `propuesta-la-mera-fabrica.md`, "no inventar información").
- Las imágenes de banners y de la sección "Nosotros" se suben a un bucket de Supabase Storage nuevo llamado `contenido` (se crea solo, igual que el de productos en la Fase 2).
- La foto de un testimonio se pega como enlace (URL) en vez de subirse como archivo — mantiene el formulario simple para algo opcional y secundario.
- Nuevas páginas públicas: `/nosotros`, `/preguntas-frecuentes`, `/contacto`.

### Ajuste posterior a la Fase 4: el catálogo es la página principal

- Se quitó la pantalla de inicio (hero + destacados) que existía antes por separado — ahora "/" muestra directamente el catálogo con filtros. Los banners y testimonios (Fase 4) se conservan arriba y abajo del catálogo cuando hay contenido cargado.
- "/productos" sigue existiendo pero solo redirige a "/", preservando cualquier filtro en la URL (por ejemplo, "/productos?tipo=MOSAICO" redirige a "/?tipo=MOSAICO") — así ningún enlace o marcador viejo se rompe.
- No hubo cambios de base de datos ni de variables de entorno en este ajuste.

### Fase 5: notas importantes (SEO técnico y analítica)

- El esquema de base de datos **no cambió** en esta fase. No hace falta ninguna migración.
- Hay dos variables nuevas y **opcionales** en `.env.example`:
  - `NEXT_PUBLIC_SITE_URL`: la URL pública real del sitio (la que te da Vercel, o tu dominio propio), sin barra al final. La usan `/sitemap.xml`, `/robots.txt` y las etiquetas de metadata para armar enlaces completos. Mientras no la pongas, el sitio funciona igual pero esos enlaces apuntan a `localhost` — ponla en cuanto despliegues a Vercel.
  - `NEXT_PUBLIC_GA_ID`: el ID de medición de Google Analytics 4 (empieza con "G-", gratis). Mientras lo dejes vacío, no se carga ningún script de analítica ni se manda ningún dato — el sitio simplemente no mide visitas todavía.
- `/sitemap.xml` y `/robots.txt` se generan solos (no son archivos estáticos) a partir del catálogo activo — no hay que tocarlos cuando agregas o quitas productos.
- Datos estructurados (schema.org, invisibles pero los leen los buscadores): `LocalBusiness` en todas las páginas públicas (con la ubicación real del negocio — Nacaome, Valle, Honduras — más los datos que hayas cargado en `/admin/configuracion`), `Product` en cada ficha de producto (sin precio, como en todo el sitio), y `FAQPage` en `/preguntas-frecuentes` solo si ya cargaste alguna pregunta. Ninguno inventa datos: si un campo no está cargado, simplemente no aparece en el bloque de datos estructurados.
- Analítica de embudo: si configuras `NEXT_PUBLIC_GA_ID`, además de las visitas a página se registran tres eventos — "agregar_cotizacion" (producto agregado al carrito), "enviar_cotizacion" (formulario de cotización enviado) y "clic_whatsapp" (clic en cualquier botón de WhatsApp, con el lugar desde donde se hizo clic). Los vas a ver en Google Analytics, en Informes → Interacción → Eventos.

### Fase 6: notas importantes (calculadora de cobertura y optimización)

- El esquema de base de datos **no cambió** en esta fase. No hace falta ninguna migración.
- **Calculadora de cobertura**: en la ficha de cada producto, junto al campo de cantidad, hay un enlace "Calcúlalo con las medidas de tu espacio". El cliente mide las secciones de su área (mosaico: largo × ancho de cada sección, para espacios en L) o los tramos de pared (moldura: longitud de cada uno), agrega un margen para cortes/roturas (10% sugerido, editable) y el resultado se copia directo al campo de cantidad. Es la misma calculadora para ambos tipos de producto (ver `propuesta-la-mera-fabrica.md`, "calculadora unificada") y no depende de que el producto tenga cargadas especificaciones técnicas — funciona para cualquier producto del catálogo.
- **Optimización de costos**: las páginas que casi no cambian (ficha de producto, Nosotros, preguntas frecuentes, contacto) ahora se sirven cacheadas hasta 5 minutos (`export const revalidate = 300`) en vez de consultar Supabase en cada visita — reduce el consumo de la capa gratuita. Cualquier edición desde el panel sigue reflejándose al instante gracias a `revalidatePath`, así que nunca hay que esperar esos 5 minutos para ver un cambio. La página principal (el catálogo con filtros) no se cachea así porque depende de los parámetros de búsqueda de cada visita (`?tipo=`, `?categoria=`, etc.).
- Se agregaron pantallas de carga (esqueletos) para el catálogo y la ficha de producto, y una página de "producto no encontrado" con la marca del sitio en vez del 404 genérico de Next.js.

## Sobre este repositorio

Este proyecto se construyó en una sesión de Cowork (Claude) dentro de un sandbox en la nube con salida de red muy restringida: solo permite HTTPS a un puñado de dominios permitidos, no conexiones TCP directas a bases de datos ni a los dominios que Next.js y Prisma necesitan en instalación/build (`binaries.prisma.sh`, el motor de Prisma; `fonts.googleapis.com`, para `next/font`). Por eso `npm install`, `npm run db:migrate` y `npm run build` no se pudieron ejecutar de punta a punta ahí, y no fue posible aplicar el esquema contra la base de datos real desde esa sesión — sí se validó el código con ESLint y `tsc --noEmit`, ambos sin errores. En tu máquina, con acceso normal a internet, estos comandos deberían correr sin problema.

## Roadmap

Fase 0 (producto/arquitectura) → Fase 1 (fundación técnica) → Fase 2 (catálogo público + panel de productos) → Fase 3 (cotización) → Fase 4 (contenido) → Fase 5 (SEO y analítica) → **Fase 6 (esto: calculadora y optimización)**.

Con esto se completa el roadmap aprobado en la Fase 0. El sitio queda funcionalmente completo — cualquier trabajo posterior sería a partir de lo que salga de usarlo en producción (nuevas ideas, ajustes, expansión de catálogo), no fases pendientes del plan original.
