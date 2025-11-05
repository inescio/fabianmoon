import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Michroma } from 'next/font/google'
import './globals.css'

// Fuente para textos: MoMo Trust Display (desde archivo local)
const momoTrustDisplay = localFont({
  src: './fonts/MomoTrustDisplay-Regular.ttf',
  variable: '--font-momo',
  display: 'swap',
  fallback: ['sans-serif'],
  weight: '400',
})

// Fuente para títulos: Michroma (desde Google Fonts)
// TODO: Si descargas Michroma localmente, reemplaza esto con localFont
const michroma = Michroma({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-michroma',
  display: 'swap',
})

// Para usar Michroma local cuando la descargues, descomenta esto y comenta la línea de Google Fonts arriba:
/*
const michroma = localFont({
  src: './fonts/Michroma-Regular.ttf', // o .woff2, .woff según el formato que tengas
  variable: '--font-michroma',
  display: 'swap',
  fallback: ['sans-serif'],
})
*/

export const metadata: Metadata = {
  title: 'Fabián Moon - Peluquería & Barbería de Autor en La Rioja Capital',
  description: 'Peluquería y barbería de autor en La Rioja Capital. Estilo, precisión y personalidad en cada corte. Reservá tu turno ahora.',
  openGraph: {
    title: 'Fabián Moon - Peluquería & Barbería de Autor en La Rioja Capital',
    description: 'Peluquería y barbería de autor en La Rioja Capital. Estilo, precisión y personalidad en cada corte. Reservá tu turno ahora.',
    url: 'https://fabianmoon.com',
    siteName: 'Fabián Moon',
    images: [
      {
        url: '/moon5.jpg',
        width: 1200,
        height: 630,
        alt: 'Fabián Moon - Peluquería & Barbería de Autor',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fabián Moon - Peluquería & Barbería de Autor en La Rioja Capital',
    description: 'Peluquería y barbería de autor en La Rioja Capital. Estilo, precisión y personalidad en cada corte. Reservá tu turno ahora.',
    images: ['/moon5.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${momoTrustDisplay.variable} ${michroma.variable} font-momo antialiased`} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
        {children}
      </body>
    </html>
  )
}

