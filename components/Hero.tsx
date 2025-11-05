'use client';

import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { Button } from './Button';
import { WordRotate } from './ui/word-rotate';
import { motion } from 'framer-motion';

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

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-6"
        >
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-4">
            <span 
              className="text-gradient-gold" 
              style={{ 
                opacity: 1, 
                filter: 'none',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              Fabián Moon
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="mb-12"
        >
          <WordRotate
            words={['Estilo', 'Personalidad', 'Perfección', 'Tu mejor apariencia']}
            duration={3000}
            className="text-2xl sm:text-4xl text-foreground/90 font-light tracking-wide"
            motionProps={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -20 },
              transition: { duration: 0.3, ease: 'easeOut' },
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
        >
          <Button
            onClick={() => scrollToSection('ubicacion')}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg px-8 py-6 shadow-gold-glow hover:shadow-elegant transition-all duration-300 hover:scale-105"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Reservar Turno
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

