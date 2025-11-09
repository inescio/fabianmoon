'use client';

import { useState } from 'react';
import { Inter } from 'next/font/google';
import { BookingForm } from '@/components/BookingForm';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function ReservarPage() {
  const [bookingSuccess, setBookingSuccess] = useState(false);

  return (
    <div className={`${inter.variable} font-sans min-h-screen bg-black`}>
      <Navbar />
      <section className="py-12 sm:py-20 bg-background font-sans">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {!bookingSuccess ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 sm:mb-12"
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                  Reserva tu <span className="text-gradient-gold">Turno</span>
                </h1>
                <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-accent to-yellow-600 mx-auto mb-4 sm:mb-6"></div>
                <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto px-4">
                  Completa el formulario para reservar tu turno. Selecciona tus servicios preferidos y elige el horario que mejor te convenga.
                </p>
              </motion.div>

              <BookingForm onSuccess={() => setBookingSuccess(true)} />
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center glass rounded-2xl p-8"
            >
              <CheckCircle className="h-16 w-16 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">
                ¡Turno Reservado!
              </h2>
              <p className="text-xl text-foreground/70 mb-6">
                Tu turno ha sido reservado exitosamente. Te enviaremos una confirmación por email.
              </p>
              <Link href="/">
                <button className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-3 rounded-lg transition-colors">
                  Volver al inicio
                </button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

