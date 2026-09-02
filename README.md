# Fabián Moon - Peluquería & Barbería

Sitio web profesional para Fabián Moon, peluquería y barbería de autor en La Rioja Capital.

## Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Lucide React** - Iconos
- **Radix UI** - Componentes accesibles
- **Class Variance Authority** - Variantes de componentes

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

3. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Estructura del Proyecto

```
├── app/
│   ├── layout.tsx      # Layout principal
│   ├── page.tsx         # Página principal
│   └── globals.css      # Estilos globales
├── components/
│   ├── Button.tsx       # Componente de botón reutilizable
│   ├── Navbar.tsx       # Barra de navegación
│   ├── Hero.tsx         # Sección hero
│   ├── About.tsx        # Sección sobre nosotros
│   ├── Services.tsx     # Sección de servicios
│   ├── Gallery.tsx      # Galería de trabajos
│   ├── Location.tsx     # Ubicación y contacto
│   ├── Footer.tsx       # Pie de página
│   └── WhatsAppButton.tsx # Botón flotante de WhatsApp
├── lib/
│   └── utils.ts         # Utilidades (cn function)
├── public/
│   └── assets/          # Imágenes estáticas
└── Index.tsx            # Archivo original (legacy)

## Imágenes Necesarias

Coloca las siguientes imágenes en `public/assets/`:

- `hero-salon.jpg` - Imagen principal del hero
- `stylist-portrait.jpg` - Retrato del estilista
- `service-men.jpg` - Servicio corte hombre
- `service-women.jpg` - Servicio corte mujer
- `service-color.jpg` - Servicio coloración
- `service-treatment.jpg` - Tratamientos capilares
- `service-barber.jpg` - Servicio barbería
- `service-event.jpg` - Peinados de evento
- `gallery-1.jpg` - Imagen de galería 1
- `gallery-2.jpg` - Imagen de galería 2
- `gallery-3.jpg` - Imagen de galería 3
- `gallery-4.jpg` - Imagen de galería 4

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## Fuentes Personalizadas

El proyecto está configurado para usar dos fuentes personalizadas:

- **MoMo Trust Display** - Para textos generales (clase `font-momo`)
- **Michroma** - Para títulos (clase `font-display` o `font-michroma`)

### Estado Actual

Actualmente el proyecto usa:
- **Michroma** desde Google Fonts (ya configurada y funcionando)
- **Inter** como temporal para textos (hasta que se descargue MoMo Trust Display)

### Cambiar a Fuentes Locales

Cuando descargues las fuentes personalizadas:

1. Descarga las fuentes:
   - **MoMo Trust Display**: [Fontesk](https://fontesk.com/momo-trust-display-font/)
   - **Michroma** (opcional, ya está en Google Fonts): [Fonts Shmonts](https://www.fontshmonts.com/display-fonts/michroma/)

2. Coloca los archivos de fuentes en `app/fonts/`:
   - `MoMoTrustDisplay-Regular.woff2` (o `.woff`/`.ttf`)
   - `Michroma-Regular.woff2` (opcional, ya está en Google Fonts)

3. Edita `app/layout.tsx`:
   - Comenta las líneas de Google Fonts (líneas 2-20)
   - Descomenta el código de `localFont` (líneas 23-71)
   - Guarda el archivo

El código ya está preparado con comentarios TODO para facilitar el cambio.

## Pagos con MercadoPago (señas)

Los servicios marcados con `requires_deposit` exigen una seña para reservar.
La seña es un porcentaje del total de la reserva (`NEXT_PUBLIC_DEPOSIT_PERCENTAGE`,
30% por defecto) y se cobra con **Checkout Pro**.

### Puesta en marcha

1. **Base de datos**: correr las migraciones de `supabase/migrations/` en orden,
   desde el SQL Editor de Supabase o con `psql`:

   | Migración | Qué hace |
   | --- | --- |
   | `20260901000000_initial_schema.sql` | Tablas base, RLS y catálogo de servicios |
   | `20260902000000_mercadopago_checkout.sql` | Precios, estado de pago y `payment_events` |
   | `20260903000000_precios_iniciales.sql` | Precios y qué servicios exigen seña |
   | `20260904000000_tienda.sql` | Productos, órdenes y catálogo de la tienda |
   | `20260905000000_sku_y_producto_homologacion.sql` | SKU de productos y producto de la simulación de pago |

   Son idempotentes: se pueden volver a correr sin romper nada.

2. **Ajustar precios**: los de `20260903000000` son de referencia. El precio de la
   base es el único que manda a la hora de cobrar, así que hay que dejarlo en los
   valores reales. Un servicio con `requires_deposit = true` y precio 0 no cobra nada.

3. **Variables de entorno**: copiar `.env.example` a `.env.local` y completar.
   Las credenciales de MercadoPago salen de
   [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app).

4. **Webhook**: en el panel de MercadoPago > Tus integraciones > Webhooks, dar de alta

   ```
   https://TU-DOMINIO/api/payments/webhook
   ```

   con el evento **Pagos**, y copiar la "Clave secreta" a `MP_WEBHOOK_SECRET`.

### Cómo funciona el flujo

1. El cliente elige servicios y ve el desglose: total, seña y saldo a pagar en el salón.
2. Al confirmar, el turno se crea como `pending` con `payment_status = 'pending'` y el
   horario queda retenido `NEXT_PUBLIC_PAYMENT_HOLD_MINUTES` minutos.
3. Se lo redirige al Checkout Pro de MercadoPago.
4. Al volver, `/reservar/pago` consulta el estado real del pago.
5. El webhook (o esa misma consulta) marca el pago como aprobado y pasa el turno a
   `confirmed`.
6. Si nunca paga, al vencer la retención el turno se cancela y el horario se libera solo.

Los importes **siempre** se recalculan en el servidor contra la base: lo que manda el
navegador solo indica qué servicios se eligieron.

### La tienda

`/tienda` es un flujo de e-commerce clásico, separado del de turnos:

| Ruta | Qué hace |
| --- | --- |
| `/tienda` | Listado de productos con precio y stock |
| `/tienda/carrito` | Líneas, cantidades, datos del comprador y pago |
| `/tienda/pago` | Vuelta del checkout, con el estado real del pago |

Comparte con las señas la infraestructura de cobro —preferencia, webhook,
conciliación y `payment_events`— pero no el modelo: una orden se paga entera y
al instante, un turno paga una seña y retiene un horario.

El carrito vive en `localStorage` y guarda solo `{ productId: cantidad }`.
Nombres y precios se releen del servidor en cada pantalla, así una lista de
precios vieja guardada en el navegador no puede alterar lo que se cobra. El
servidor recalcula todo igual antes de crear la preferencia.

A diferencia de la seña, la preferencia de la tienda lleva **una línea por
producto** con su cantidad y precio unitario reales: lo que el comprador ve en
el carrito es exactamente lo que ve en el checkout.

**SKU e imagen.** Cada producto tiene un `sku` de 4 dígitos que es lo que viaja
como `id` del ítem en la preferencia —no el uuid, que a MercadoPago no le dice
nada—. Se asigna solo, con una secuencia que arranca en 1001.

`image_url` puede guardarse relativa (`/moon5.jpg`) para que el catálogo no quede
atado a un dominio: la ruta de órdenes la resuelve contra la URL del sitio antes
de mandarla. MercadoPago se descarga la imagen y la rehospeda en su propio CDN,
así que tiene que ser públicamente accesible desde internet — con la app
corriendo en localhost, no la va a poder bajar.

**Producto de la simulación de pago.** El SKU `9001` ("Terminal de Venta Móvil")
existe para el desafío de Partners: su descripción es literal la que exige
MercadoPago. Antes de que la peluquería salga en vivo con su catálogo real hay
que darlo de baja:

```sql
update public.products set active = false where sku = '9001';
```

**Qué distingue un pago de otro.** El `external_reference` va prefijado:
`order:<uuid>` o `appointment:<uuid>`. Es lo único que MercadoPago devuelve
intacto en la notificación, y con eso el webhook sabe qué actualizar. Los turnos
creados antes de que existiera la tienda mandaban el uuid pelado; esos se
siguen interpretando como turnos.

**Stock.** Se valida al crear la orden, pero **no se descuenta** al pagar. Es
informativo para el listado; si la tienda crece, hay que descontarlo desde el
webhook y reponerlo ante una devolución.

### Los dos SDK de MercadoPago

La integración usa el SDK en las dos puntas, como pide Checkout Pro:

| Punta | Paquete | Dónde |
| --- | --- | --- |
| Back-end | `mercadopago` | [lib/mercadopago.ts](lib/mercadopago.ts) crea preferencias y consulta pagos |
| Front-end | `@mercadopago/sdk-react` | [/tienda/carrito](app/tienda/carrito/page.tsx) renderiza el botón oficial |

En el carrito el pago es en dos tiempos: **Continuar al pago** crea la orden y la
preferencia contra el back-end, y recién ahí el SDK renderiza el Wallet Brick con
ese `preferenceId`. Se usa `valueProp: 'payment_methods_logos'`, que muestra
debajo del botón los logos oficiales de los medios de pago disponibles.

Mientras la preferencia está viva el pedido queda congelado —cantidades y
formulario deshabilitados—, porque tocar el carrito dejaría el checkout cobrando
algo distinto de lo que se ve en pantalla. "Modificar el pedido" lo desbloquea y
genera una preferencia nueva.

`NEXT_PUBLIC_MP_PUBLIC_KEY` tiene que ser la clave pública de **la misma cuenta**
que el `MP_ACCESS_TOKEN`: si no coinciden, el brick no puede abrir la
preferencia. Si la variable falta, el checkout sigue funcionando por redirección
al `init_point`; lo que se pierde es el botón oficial.

El flujo de reservas (`/reservar`) sigue redirigiendo al `init_point`, que
también es una integración válida de Checkout Pro.

### URL de retorno

MercadoPago exige **tres URL distintas**, una por escenario. Mandar la misma
para los tres baja el puntaje de calidad de la integración.

| Escenario | Tienda | Turnos |
| --- | --- | --- |
| `back_urls.success` | `/tienda/pago/exito` | `/reservar/pago/exito` |
| `back_urls.pending` | `/tienda/pago/pendiente` | `/reservar/pago/pendiente` |
| `back_urls.failure` | `/tienda/pago/error` | `/reservar/pago/error` |

Las tres renderizan el mismo componente y **el escenario es solo una pista**: la
pantalla verifica igual el estado real contra `/api/payments/status`, porque esa
URL la puede escribir cualquiera. Sirve para el mensaje de espera y como
respaldo si no se puede verificar.

`/tienda/pago` y `/reservar/pago` sin sufijo siguen existiendo, para las órdenes
y turnos creados antes de este cambio.

### Integrator ID

`MP_INTEGRATOR_ID` es el código del Programa de Partners de MercadoPago. Se
carga una sola vez en [lib/mercadopago.ts](lib/mercadopago.ts) y el SDK lo manda
como header `X-Integrator-Id` en **todas** las llamadas a la API —crear
preferencias, consultar y buscar pagos—, que es lo que atribuye la integración a
la cuenta certificada. No es un secreto, pero si falta en producción se pierden
los beneficios del programa, así que `npm run check:mp` lo marca como error.

Ojo con una trampa del SDK: los clientes hacen
`this.config.options = { ...options, ...requestOptions }` antes de disparar el
request, o sea que **mutan** el config que reciben. Por eso `newConfig()` arma
uno nuevo en cada llamada en vez de compartir una instancia: con una sola
compartida, dos compras simultáneas pueden pisarse la `idempotencyKey` entre esa
asignación y el fetch, y MercadoPago devolvería la preferencia de la otra orden.

### Acceso a los datos

`services` y `professionals` son de lectura pública: el navegador los consulta con la
anon key para armar el formulario.

`appointments`, `appointment_services` y `payment_events` tienen RLS activo y **ninguna
policy**, porque guardan nombre, teléfono y email de los clientes y la anon key es
pública. Solo los alcanza la `service_role`, desde el servidor. Por eso
`SUPABASE_SERVICE_ROLE_KEY` es obligatoria: sin ella no se puede reservar ni cobrar.

### Verificar la conexión

```bash
npm run check:mp
```

Revisa de una las variables de entorno, el esquema de Supabase, los precios
cargados, las credenciales de MercadoPago y si el webhook es alcanzable.
Solo lee; lo único que crea es una preferencia de prueba para confirmar que la
API acepta el payload real de la app.

### Deploy en Vercel

Variables de entorno del proyecto (Settings > Environment Variables):

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | La URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API > `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API > `service_role` |
| `MP_ACCESS_TOKEN` | Credenciales de MercadoPago |
| `MP_WEBHOOK_SECRET` | Recién existe después de registrar el webhook |
| `NEXT_PUBLIC_SITE_URL` | El dominio de producción, sin barra final |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Clave pública, misma cuenta que el access token |
| `MP_INTEGRATOR_ID` | Integrator ID del Programa de Partners |
| `MP_BINARY_MODE` | Opcional, default `true`. Solo afecta a la tienda |
| `MP_MAX_INSTALLMENTS` | Opcional, default 12 |
| `NEXT_PUBLIC_DEPOSIT_PERCENTAGE` | Opcional, default 30 |
| `NEXT_PUBLIC_PAYMENT_HOLD_MINUTES` | Opcional, default 30 |

`SUPABASE_DB_URL` **no va en Vercel**: solo se usa para correr migraciones
desde la terminal.

Las `NEXT_PUBLIC_*` se compilan dentro del bundle, así que **cambiarlas exige
volver a deployar**. De ahí el orden:

1. Primer deploy con las claves de Supabase y `MP_ACCESS_TOKEN`. `NEXT_PUBLIC_SITE_URL`
   todavía puede faltar: el código cae a `VERCEL_URL`.
2. Con el dominio ya asignado, cargar `NEXT_PUBLIC_SITE_URL` y redeployar.
   Tiene que ser el dominio **estable**, no el de un deploy puntual: `VERCEL_URL`
   cambia en cada push y dejaría el webhook apuntando a una URL muerta.
3. Registrar el webhook en MercadoPago con ese dominio, copiar la clave secreta a
   `MP_WEBHOOK_SECRET` y redeployar.

Si activás Deployment Protection, dejá producción pública: MercadoPago no puede
autenticarse y el webhook recibiría un 401.

### Probar en desarrollo

Con credenciales `TEST-`, MercadoPago da
[usuarios y tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards).
El webhook no llega a `localhost`, pero la pantalla de vuelta consulta el pago
directo a la API, así que el flujo se puede probar entero igual. Para recibir el
webhook localmente, exponé el puerto con `ngrok` y usá esa URL en `NEXT_PUBLIC_SITE_URL`.

## Notas

- El proyecto usa el App Router de Next.js 14
- Los componentes client-side tienen la directiva `'use client'`
- Las imágenes se optimizan automáticamente con Next.js Image
- Los estilos personalizados (glass effects, gradients) están en `globals.css`
- Las fuentes se cargan automáticamente usando `next/font/local`

