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

