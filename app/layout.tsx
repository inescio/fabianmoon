import type { Metadata } from 'next'
import { Bebas_Neue, Michroma } from 'next/font/google'
import './globals.css'

// Fuente para textos generales: Bebas Neue (desde Google Fonts)
const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

// Fuente para "Fabián Moon" y navbar: Michroma (desde Google Fonts)
const michroma = Michroma({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-michroma',
  display: 'swap',
})

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
      <body className={`${bebasNeue.variable} ${michroma.variable} font-bebas antialiased`} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
        {children}
      </body>
    </html>
  )
}

