'use client';

import Image from 'next/image';
import { TextReveal } from './ui/text-reveal';
import { motion } from 'framer-motion';

export const About = () => {
  return (
    <section className="pt-0 pb-20 bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-elegant h-[600px] w-full">
              <Image
                src="/moon1.png.webp"
                alt="Fabián Moon - Estilista Profesional"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div className="absolute -top-4 -left-4 w-24 h-24 border-2 border-accent/30 rounded-full"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 border-2 border-accent/20 rounded-full"></div>
          </motion.div>

          <TextReveal className="space-y-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
                Sobre <span className="text-gradient-gold">Nosotros</span>
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-accent to-yellow-600 mb-6"></div>
            </div>

            <p className="text-lg text-foreground/80 leading-relaxed">
              Fabián Moon combina técnica, creatividad y atención al detalle. Con más de 15 años de experiencia en el arte de la peluquería, transforma cada visita en una experiencia única de estilo y bienestar.
            </p>

            <p className="text-lg text-foreground/80 leading-relaxed">
              Nuestro salón en La Rioja Capital es un espacio donde la elegancia se encuentra con la innovación. Utilizamos las técnicas más avanzadas y productos de primera calidad para garantizar resultados excepcionales.
            </p>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center glass rounded-lg p-4">
                <div className="text-3xl font-bold text-accent mb-1">15+</div>
                <div className="text-sm text-foreground/60">Años de Experiencia</div>
              </div>
              <div className="text-center glass rounded-lg p-4">
                <div className="text-3xl font-bold text-accent mb-1">5000+</div>
                <div className="text-sm text-foreground/60">Clientes Satisfechos</div>
              </div>
              <div className="text-center glass rounded-lg p-4">
                <div className="text-3xl font-bold text-accent mb-1">100%</div>
                <div className="text-sm text-foreground/60">Dedicación</div>
              </div>
            </div>
          </TextReveal>
        </div>
      </div>
    </section>
  );
};

