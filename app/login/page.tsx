'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar si ya está autenticado
    const authStatus = localStorage.getItem('management_access');
    if (authStatus === 'granted') {
      setIsAuthenticated(true);
      router.push('/gestion');
    }
  }, [router]);

  const handleLogin = () => {
    // Simplemente establecer el acceso en localStorage
    localStorage.setItem('management_access', 'granted');
    setIsAuthenticated(true);
    router.push('/gestion');
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center glass rounded-2xl p-8"
          >
            <h1 className="text-3xl font-bold mb-4">
              Acceso a <span className="text-gradient-gold">Gestión</span>
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-accent to-yellow-600 mx-auto mb-6"></div>
            <p className="text-xl text-foreground/70 mb-8">
              Haz clic en el botón para acceder al panel de gestión de turnos.
            </p>
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xl px-8 py-6 shadow-gold-glow hover:shadow-elegant transition-all duration-300 hover:scale-105"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Acceder a Gestión
            </Button>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

