'use client';

import { Inter } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function PresupuestoFabianMoon() {
  const info = {
    cliente: "Fabian Moon - Peluquería y Barbería",
    fecha: "06 de Noviembre de 2025",
    validez: "30 días",
  };

  const servicios = [
    {
      titulo: "1. DISEÑO WEB PROFESIONAL",
      items: [
        "Diseño UI/UX personalizado según identidad de marca",
        "Diseño responsive (adaptable a móviles, tablets y desktop)",
        "Maquetación de hasta 5 páginas (Inicio, Servicios, Galería, Turnos, Contacto)",
        "Selección de paleta de colores y tipografías",
        "Optimización de imágenes y recursos gráficos",
      ],
      icon: "🎨",
    },
    {
      titulo: "2. DESARROLLO E IMPLEMENTACIÓN",
      items: [
        "Programación frontend (HTML5, CSS3, JavaScript)",
        "Programación backend y base de datos",
        "Integración de todos los módulos",
        "Optimización SEO básica",
        "Configuración de formularios de contacto",
        "Implementación de sistema de turnos",
        "Testing y corrección de errores",
        "Capacitación en uso del sistema (2 horas)",
      ],
      icon: "⚙️",
    },
    {
      titulo: "3. SISTEMA DE GESTIÓN DE TURNOS - CLIENTES",
      items: [
        "Reserva online 24/7",
        "Selección de servicios y profesionales",
        "Calendario interactivo con disponibilidad en tiempo real",
        "Confirmación automática por email/WhatsApp",
        "Recordatorios automáticos de citas",
        "Cancelación y reprogramación de turnos",
        "Historial de turnos del cliente",
      ],
      icon: "📱",
    },
    {
      titulo: "4. SISTEMA DE GESTIÓN DE TURNOS - ADMINISTRACIÓN",
      items: [
        "Panel de administración completo",
        "Gestión de agenda y disponibilidad",
        "Administración de servicios y precios",
        "Gestión de profesionales/empleados",
        "Control de turnos (confirmar, cancelar, modificar)",
        "Reportes y estadísticas",
        "Base de datos de clientes",
        "Notificaciones y alertas",
      ],
      icon: "🖥️",
    },
    {
      titulo: "5. DOMINIO Y HOSTING",
      items: [
        "Registro de dominio .com o .com.ar (1 año)",
        "Hosting profesional con SSL incluido (1 año)",
        "Configuración de cuentas de correo corporativo (hasta 5)",
        "Certificado SSL para conexión segura",
        "Backup automático semanal",
      ],
      icon: "🌐",
    },
    {
      titulo: "6. SUSCRIPCIÓN SISTEMA LUPPA",
      bonificado: true,
      items: [
        "Suscripción anual al sistema de gestión Luppa",
        "Integración completa con el sitio web",
        "Soporte técnico incluido",
        "Actualizaciones automáticas",
      ],
      icon: "🎁",
    },
    {
      titulo: "7. MANTENIMIENTO Y SOPORTE (12 MESES)",
      items: [
        "Actualizaciones de seguridad",
        "Backup mensual de sitio completo",
        "Soporte técnico vía email/WhatsApp",
        "Corrección de errores menores",
        "Actualización de contenidos (hasta 2 horas/mes)",
        "Monitoreo de funcionamiento",
        "Renovación de certificado SSL",
      ],
      icon: "🔧",
    },
  ];

  const total = 2200000; // único precio visible

  const entregables = [
    "Sitio web completo y funcional",
    "Sistema de gestión de turnos operativo",
    "Panel de administración configurado",
    "Dominio registrado y hosting activo",
    "Cuentas de correo configuradas",
    "Manual de uso del sistema",
    "Capacitación presencial o virtual",
    "Credenciales de acceso a todos los sistemas",
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className={`${inter.variable} font-sans min-h-screen bg-[radial-gradient(1200px_600px_at_100%_-10%,#182034_0,transparent_60%),radial-gradient(900px_500px_at_-20%_0,transparent_55%),#0f1115] text-slate-100`}>
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 print:px-0 pt-24 sm:pt-28">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">PRESUPUESTO WEB</h1>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm sm:text-base font-semibold text-emerald-200">
              <span className="hidden sm:inline">Cliente:</span>
              <span>{info.cliente}</span>
            </div>
          </div>

          {/* Info bar */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Fecha", value: info.fecha },
              { label: "Validez", value: info.validez },
              { label: "Entrega", value: "30-45 días" },
            ].map((it, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <div className="text-sm uppercase tracking-[0.12em] text-slate-400">{it.label}</div>
                <div className="text-lg sm:text-xl font-bold mt-1">{it.value}</div>
              </div>
            ))}
          </div>

          {/* Descripción */}
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold mb-3">📋 Descripción del Proyecto</h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Desarrollo e implementación de sitio web profesional con sistema integrado de gestión de turnos para peluquería y barbería, incluyendo panel de administración para el negocio y sistema de reservas para clientes.
            </p>
          </section>

          {/* Servicios sin precios por módulo */}
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">💼 Módulos del Proyecto</h2>
            <div className="mt-4 grid gap-4 sm:gap-5">
              {servicios.map((s, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border bg-slate-900/40 p-4 sm:p-5 ${
                    s.bonificado ? "border-emerald-400/40" : "border-white/10"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="text-base sm:text-lg font-semibold">
                      <span className="mr-2">{s.icon}</span>
                      {s.titulo}
                    </div>
                    {s.bonificado && (
                      <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-200 w-fit">
                        BONIFICADO
                      </span>
                    )}
                  </div>
                  <ul className="mt-3 ml-5 sm:ml-6 list-disc text-sm sm:text-base text-slate-300 space-y-2">
                    {s.items.map((i, k) => (
                      <li key={k}>{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Resumen: solo precio final */}
          <section className="mt-6 rounded-2xl border border-indigo-400/30 bg-gradient-to-b from-indigo-400/10 to-emerald-400/10 p-5 sm:p-6 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">💰 Inversión</h2>
            <div className="mt-4 grid gap-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 text-center sm:text-right">
                <div className="text-sm sm:text-base font-semibold text-slate-300 mb-2">TOTAL PROYECTO</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black">${total.toLocaleString("es-AR")}</div>
              </div>
              <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4 text-base sm:text-lg text-emerald-100">
                🎉 Incluye 1 año de suscripción GRATUITA a Luppa
              </div>
            </div>
          </section>

          {/* Entregables */}
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">📦 Entregables</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {entregables.map((e, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-slate-900/40 p-3 sm:p-4 text-sm sm:text-base">
                  ✓ {e}
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 text-center text-sm sm:text-base text-slate-300">
            <p className="font-semibold text-base sm:text-lg">Presupuesto válido por 30 días desde la fecha de emisión</p>
            <p className="mt-3">
              Para aceptar este presupuesto o consultas, contactar a:
              <br />
              <span className="text-slate-400">[Tu nombre/empresa] • [Teléfono] • [Email]</span>
            </p>
          </footer>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            html, body { background: #fff !important; }
            .bg-\\[radial-gradient\\(1200px_600px_at_100%_-10%\\,#182034_0,transparent_60%\\),radial-gradient\\(900px_500px_at_-20%_0,transparent_55%\\),#0f1115\\] { background: #fff !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            nav { display: none !important; }
            footer { display: none !important; }
            .pt-24, .pt-28 { padding-top: 0 !important; }
          }
        `}</style>
      </div>
      <Footer />
    </div>
  );
}

