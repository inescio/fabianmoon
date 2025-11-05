'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from './Button';

export const Gallery = () => {
  const [activeFilter, setActiveFilter] = useState('Todos');

  const filters = ['Todos', 'Hombre', 'Mujer', 'Color', 'Eventos'];

  const galleryItems = [
    { id: 1, category: 'Color', image: '/moon1.png.webp', alt: 'Balayage rubio profesional' },
    { id: 2, category: 'Hombre', image: '/moon2.png.jpg', alt: 'Corte moderno fade' },
    { id: 3, category: 'Color', image: '/moon3.jpg', alt: 'Coloración cobriza' },
    { id: 4, category: 'Eventos', image: '/moon4.jpg', alt: 'Peinado de novia elegante' },
    { id: 5, category: 'Mujer', image: '/moon1.png.webp', alt: 'Corte en capas largo' },
    { id: 6, category: 'Hombre', image: '/moon2.png.jpg', alt: 'Estilo texturizado' },
    { id: 7, category: 'Color', image: '/moon3.jpg', alt: 'Mechas californianas' },
    { id: 8, category: 'Eventos', image: '/moon4.jpg', alt: 'Recogido sofisticado' },
  ];

  const filteredItems = activeFilter === 'Todos'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeFilter);

  return (
    <section id="galeria" className="py-12 sm:py-20 bg-gradient-to-b from-secondary to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Nuestros <span className="text-gradient-gold">Trabajos</span>
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-accent to-yellow-600 mx-auto mb-4 sm:mb-6"></div>
          <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto px-4">
            Cada cliente es una obra de arte
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              variant={activeFilter === filter ? "default" : "outline"}
              className={
                activeFilter === filter
                  ? "bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm sm:text-base px-3 sm:px-4 py-2"
                  : "glass glass-hover border-accent/30 text-foreground/80 hover:text-accent text-sm sm:text-base px-3 sm:px-4 py-2"
              }
            >
              {filter}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="relative group overflow-hidden rounded-xl aspect-square cursor-pointer animate-scale-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="p-4 w-full">
                  <p className="text-foreground font-semibold">{item.alt}</p>
                  <p className="text-accent text-sm">{item.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-12 px-4">
          <a
            href="https://instagram.com/fabianmoon.peluqueria"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 glass px-4 sm:px-6 py-2 sm:py-3 rounded-full glass-hover font-semibold text-sm sm:text-base text-foreground hover:text-accent transition-colors"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span className="hidden sm:inline">Seguinos en Instagram</span>
            <span className="sm:hidden">@fabianmoon</span>
          </a>
        </div>
      </div>
    </section>
  );
};

