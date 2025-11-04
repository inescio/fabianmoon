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

## Notas

- El proyecto usa el App Router de Next.js 14
- Los componentes client-side tienen la directiva `'use client'`
- Las imágenes se optimizan automáticamente con Next.js Image
- Los estilos personalizados (glass effects, gradients) están en `globals.css`
- Las fuentes se cargan automáticamente usando `next/font/local`

