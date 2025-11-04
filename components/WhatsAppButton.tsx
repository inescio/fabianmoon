'use client';

import { MessageCircle } from 'lucide-react';

export const WhatsAppButton = () => {
  const whatsappNumber = '5493804123456';
  
  const handleClick = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=Hola, quiero reservar un turno`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-elegant hover:shadow-gold-glow transition-all duration-300 hover:scale-110 z-50 animate-bounce"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};

