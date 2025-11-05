'use client';

import Image from 'next/image';
import Link from 'next/link';
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
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-0">
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

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-4 sm:mb-6"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-bold tracking-tight mb-3 sm:mb-4">
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
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="mb-8 sm:mb-12"
        >
          <WordRotate
            words={['Estilo', 'Personalidad', 'Perfección', 'Tu mejor apariencia']}
            duration={3000}
            className="text-xl sm:text-2xl lg:text-4xl text-foreground/90 font-light tracking-wide px-2"
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
          <Link href="/reservar">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-lg sm:text-xl px-6 sm:px-8 py-4 sm:py-6 shadow-gold-glow hover:shadow-elegant transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Reservar Turno
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

