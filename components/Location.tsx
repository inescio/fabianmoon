'use client';

import { MessageCircle, MapPin, Phone, Clock, Mail } from 'lucide-react';
import { Button } from './Button';

export const Location = () => {
  const whatsappNumber = '5493804123456';
  const handleWhatsApp = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=Hola, quiero reservar un turno`, '_blank');
  };

  return (
    <section id="ubicacion" className="py-12 sm:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Encontranos en <span className="text-gradient-gold">La Rioja</span>
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-accent to-yellow-600 mx-auto mb-4 sm:mb-6"></div>
          <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto px-4">
            Visitá nuestro salón en el corazón de La Rioja Capital
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            <div className="glass rounded-2xl p-6 sm:p-8 space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gradient-gold">
                Información de Contacto
              </h3>

              <div className="flex items-start gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Dirección</h4>
                  <p className="text-foreground/70">
                    Av. Rivadavia 123<br />
                    La Rioja Capital, La Rioja<br />
                    Argentina
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Teléfono</h4>
                  <a href="tel:+5493804123456" className="text-foreground/70 hover:text-accent transition-colors">
                    +54 9 380 4123456
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Horarios</h4>
                  <div className="text-foreground/70 space-y-1">
                    <p>Martes a Viernes: 9:00 - 20:00</p>
                    <p>Sábado: 9:00 - 18:00</p>
                    <p className="text-accent">Domingo y Lunes: Cerrado</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Email</h4>
                  <a href="mailto:contacto@fabianmoon.com" className="text-foreground/70 hover:text-accent transition-colors">
                    contacto@fabianmoon.com
                  </a>
                </div>
              </div>

              <Button
                onClick={handleWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold text-base sm:text-lg py-4 sm:py-6 mt-4 sm:mt-6"
              >
                <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Reservar por WhatsApp
              </Button>
            </div>

            <div className="glass rounded-2xl p-4 sm:p-6">
              <h4 className="font-semibold text-foreground mb-3 text-sm sm:text-base">Medios de Pago</h4>
              <div className="flex flex-wrap gap-2 sm:gap-3 text-sm sm:text-base text-foreground/70">
                <span className="glass px-3 py-1 rounded-full">Efectivo</span>
                <span className="glass px-3 py-1 rounded-full">Transferencia</span>
                <span className="glass px-3 py-1 rounded-full">Tarjeta de Débito</span>
                <span className="glass px-3 py-1 rounded-full">Tarjeta de Crédito</span>
              </div>
            </div>
          </div>

          <div className="animate-fade-in">
            <div className="glass rounded-2xl overflow-hidden h-[300px] sm:h-[400px] lg:h-full lg:min-h-[500px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56890.38524755051!2d-66.8856!3d-29.4131!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9427db63d1b87cd1%3A0x2b5c0a6d5c6b3f31!2sLa%20Rioja%2C%20La%20Rioja%20Province%2C%20Argentina!5e0!3m2!1sen!2s!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Fabián Moon Peluquería"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

