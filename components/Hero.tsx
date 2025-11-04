'use client';

import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { Button } from './Button';

export const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/heromoon.png.webp"
          alt="Fabián Moon - Salón de Peluquería"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in-up">
        <div className="mb-6">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-4">
            <span className="text-gradient-gold">Fabián Moon</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto"></div>
        </div>

        <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif text-foreground/90 mb-4">
          Peluquería & Barbería de Autor en La Rioja Capital
        </h2>

        <p className="text-lg sm:text-xl text-foreground/70 mb-12 font-light tracking-wide">
          Estilo. Precisión. Personalidad.
        </p>

        <Button
          onClick={() => scrollToSection('ubicacion')}
          size="lg"
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg px-8 py-6 shadow-gold-glow hover:shadow-elegant transition-all duration-300 hover:scale-105"
        >
          <Calendar className="mr-2 h-5 w-5" />
          Reservar Turno
        </Button>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-accent/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-accent rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

