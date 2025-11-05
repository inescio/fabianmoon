'use client';

import { MapPin, Phone, Mail } from 'lucide-react';

export const Footer = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-background to-black border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              <span className="text-gradient-gold">Fabián Moon</span>
            </h3>
            <p className="text-sm sm:text-base text-foreground/70 mb-4">
              Peluquería y barbería de autor en La Rioja Capital. Estilo, precisión y personalidad en cada corte.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/fabianmoon.peluqueria"
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-2 rounded-lg glass-hover"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com/fabianmoon.peluqueria"
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-2 rounded-lg glass-hover"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 text-foreground">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('servicios')}
                  className="text-foreground/70 hover:text-accent transition-colors"
                >
                  Servicios
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('galeria')}
                  className="text-foreground/70 hover:text-accent transition-colors"
                >
                  Galería
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('ubicacion')}
                  className="text-foreground/70 hover:text-accent transition-colors"
                >
                  Ubicación
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('ubicacion')}
                  className="text-foreground/70 hover:text-accent transition-colors"
                >
                  Reservar Turno
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 text-foreground">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-foreground/70">
                <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span>Av. Rivadavia 123, La Rioja Capital</span>
              </li>
              <li className="flex items-center gap-2 text-foreground/70">
                <Phone className="h-5 w-5 text-accent flex-shrink-0" />
                <a href="tel:+5493804123456" className="hover:text-accent transition-colors">
                  +54 9 380 4123456
                </a>
              </li>
              <li className="flex items-center gap-2 text-foreground/70">
                <Mail className="h-5 w-5 text-accent flex-shrink-0" />
                <a href="mailto:contacto@fabianmoon.com" className="hover:text-accent transition-colors">
                  contacto@fabianmoon.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-sm sm:text-base text-foreground/60">
          <p className="text-center md:text-left">© {currentYear} Fabián Moon. Todos los derechos reservados.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <button className="hover:text-accent transition-colors text-xs sm:text-sm">Políticas de Privacidad</button>
            <button className="hover:text-accent transition-colors text-xs sm:text-sm">Términos y Condiciones</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

