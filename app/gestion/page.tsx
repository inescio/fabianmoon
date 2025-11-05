'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ManagementDashboard } from '@/components/ManagementDashboard';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function GestionPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar si está autenticado
    const authStatus = localStorage.getItem('management_access');
    if (authStatus === 'granted') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // La redirección se maneja en useEffect
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Gestión de <span className="text-gradient-gold">Turnos</span>
            </h1>
            <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-accent to-yellow-600 mx-auto mb-4 sm:mb-6"></div>
            <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto px-4">
              Administra los turnos reservados, asigna profesionales y actualiza el estado de cada cita.
            </p>
          </motion.div>

          <ManagementDashboard />
        </div>
      </section>
      <Footer />
    </div>
  );
}

