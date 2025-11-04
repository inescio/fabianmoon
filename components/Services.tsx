import Image from 'next/image';
import { User, Users, Palette, Sparkles, Scissors, Crown } from 'lucide-react';

export const Services = () => {
  const services = [
    {
      icon: User,
      title: 'Corte Hombre',
      description: 'Cortes modernos y clásicos adaptados a tu estilo personal',
      price: 'Desde $8.000',
      image: '/moon2.png.jpg',
    },
    {
      icon: Users,
      title: 'Corte Mujer',
      description: 'Estilos personalizados que realzan tu belleza natural',
      price: 'Desde $10.000',
      image: '/moon1.png.webp',
    },
    {
      icon: Palette,
      title: 'Coloración / Balayage',
      description: 'Técnicas avanzadas de color para un look único y sofisticado',
      price: 'Desde $15.000',
      image: '/moon3.jpg',
    },
    {
      icon: Sparkles,
      title: 'Tratamientos Capilares',
      description: 'Keratina, botox capilar e hidratación profunda',
      price: 'Desde $12.000',
      image: '/moon4.jpg',
    },
    {
      icon: Scissors,
      title: 'Barbería Clásica',
      description: 'Afeitado tradicional y perfilado de barba con navaja',
      price: 'Desde $6.000',
      image: '/moon2.png.jpg',
    },
    {
      icon: Crown,
      title: 'Peinados de Evento',
      description: 'Looks exclusivos para bodas, eventos y ocasiones especiales',
      price: 'Desde $18.000',
      image: '/moon4.jpg',
    },
  ];

  return (
    <section id="servicios" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            Nuestros <span className="text-gradient-gold">Servicios</span>
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-accent to-yellow-600 mx-auto mb-6"></div>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Experiencia premium en cada servicio, diseñado para tu estilo único
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                className="group glass rounded-2xl overflow-hidden glass-hover cursor-pointer animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  <div className="absolute top-4 right-4 bg-accent/90 p-3 rounded-full shadow-gold-glow">
                    <Icon className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-display font-semibold mb-2 text-foreground group-hover:text-accent transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-foreground/70 mb-4 text-sm leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-semibold text-lg">{service.price}</span>
                    <span className="text-xs text-foreground/50 uppercase tracking-wide">Premium</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center glass rounded-xl p-6 max-w-2xl mx-auto">
          <p className="text-foreground/80">
            <span className="font-semibold text-accent">Asesoramiento de Imagen:</span> Consulta personalizada para encontrar el estilo perfecto que refleje tu personalidad.
          </p>
        </div>
      </div>
    </section>
  );
};

