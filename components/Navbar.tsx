'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Calendar } from 'lucide-react';
import { Button } from './Button';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: 'Inicio', id: 'hero' },
    { label: 'Servicios', id: 'servicios' },
    { label: 'Galería', id: 'galeria' },
    { label: 'Ubicación', id: 'ubicacion' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass shadow-lg' : 'bg-transparent'
      }`}
      style={isScrolled ? { 
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      } : {
        background: 'transparent',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <button
            onClick={() => scrollToSection('hero')}
            className="flex items-center space-x-2 group"
          >
            <div className="relative">
              <span className="text-xl sm:text-2xl lg:text-3xl font-display font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
                Fabián Moon
              </span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-yellow-600 group-hover:w-full transition-all duration-300"></div>
            </div>
          </button>

          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm lg:text-base text-foreground/80 hover:text-accent transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
            <Link href="/reservar">
              <Button
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-gold-glow text-sm lg:text-base px-4 lg:px-6 py-2"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Reservar Turno
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden glass p-2 rounded-lg glass-hover"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden glass rounded-lg mb-4 p-4 space-y-4 animate-fade-in">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="block w-full text-left text-foreground/80 hover:text-accent transition-colors font-medium py-2"
              >
                {link.label}
              </button>
            ))}
            <Link href="/reservar">
              <Button
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Reservar Turno
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

