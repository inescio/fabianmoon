'use client';

import { useRef } from 'react';
import { TextReveal } from './ui/text-reveal';
import { HeroParallax } from './ui/hero-parallax';
import { motion } from 'framer-motion';

export const Services = () => {
  const parallaxRef = useRef<HTMLDivElement>(null);

  const baseServices = [
    {
      title: 'Corte Hombre',
      description: 'Cortes modernos y clásicos adaptados a tu estilo personal',
      thumbnail: '/moon2.png.jpg',
    },
    {
      title: 'Corte Mujer',
      description: 'Estilos personalizados que realzan tu belleza natural',
      thumbnail: '/moon1.png.webp',
    },
    {
      title: 'Coloración / Balayage',
      description: 'Técnicas avanzadas de color para un look único y sofisticado',
      thumbnail: '/moon3.jpg',
    },
    {
      title: 'Tratamientos Capilares',
      description: 'Keratina, botox capilar e hidratación profunda',
      thumbnail: '/moon4.jpg',
    },
    {
      title: 'Barbería Clásica',
      description: 'Afeitado tradicional y perfilado de barba con navaja',
      thumbnail: '/moon5.jpg',
    },
    {
      title: 'Peinados de Evento',
      description: 'Looks exclusivos para bodas, eventos y ocasiones especiales',
      thumbnail: '/moon6.jpg',
    },
    {
      title: 'Mechas y Reflejos',
      description: 'Técnicas de mechas californianas y reflejos que iluminan tu rostro',
      thumbnail: '/moon7.jpg',
    },
    {
      title: 'Cortes de Autor',
      description: 'Diseños únicos y personalizados creados especialmente para ti',
      thumbnail: '/moon8.jpg',
    },
    {
      title: 'Alisado y Keratina',
      description: 'Tratamientos profesionales para cabello liso y sedoso',
      thumbnail: '/moon5.jpg',
    },
    {
      title: 'Cuidado y Estilo',
      description: 'Servicios completos de cuidado capilar y estilismo',
      thumbnail: '/moon6.jpg',
    },
  ];

  // Duplicamos los servicios para llenar las 3 filas del parallax (5 servicios por fila)
  const parallaxServices = [
    ...baseServices,
    ...baseServices.slice(0, 5), // Agregamos 5 más para tener 15 total
  ];

  return (
    <section id="servicios" className="relative bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <TextReveal className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            Nuestros <span className="text-gradient-gold">Servicios</span>
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-accent to-yellow-600 mx-auto mb-6"></div>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Experiencia premium en cada servicio, diseñado para tu estilo único
          </p>
        </TextReveal>
      </div>

      <div ref={parallaxRef}>
        <HeroParallax products={parallaxServices} areLinksDisabled={true} />
      </div>
    </section>
  );
};

