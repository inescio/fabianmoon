'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Calendar } from '@/components/ui/calendar';
import { supabase, Service, Professional } from '@/lib/supabase';
import { generateTimeSlots, formatDate, isValidEmail, isValidPhone } from '@/lib/booking-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BookingFormProps {
  onSuccess?: () => void;
}

type FormStep = 'services' | 'date' | 'time' | 'professional' | 'client';

export function BookingForm({ onSuccess }: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('services');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Datos del formulario
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Datos de la API
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const excludedServiceNames = useMemo(() => new Set(['Cortes de Autor', 'Cuidado y Estilo']), []);

  const sanitizeServices = useCallback(
    (servicesList: Service[] = []) =>
      servicesList.filter((service) => !excludedServiceNames.has(service.name)),
    [excludedServiceNames]
  );

  // Errores
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Servicios por defecto (fallback cuando Supabase no está disponible)
  const defaultServices: Service[] = [
    {
      id: '1',
      name: 'Corte Hombre',
      description: 'Cortes modernos y clásicos adaptados a tu estilo personal',
      duration_minutes: 45,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Corte Mujer',
      description: 'Estilos personalizados que realzan tu belleza natural',
      duration_minutes: 45,
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Coloración / Balayage',
      description: 'Técnicas avanzadas de color para un look único y sofisticado',
      duration_minutes: 90,
      created_at: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Tratamientos Capilares',
      description: 'Keratina, botox capilar e hidratación profunda',
      duration_minutes: 90,
      created_at: new Date().toISOString(),
    },
    {
      id: '5',
      name: 'Barbería Clásica',
      description: 'Afeitado tradicional y perfilado de barba con navaja',
      duration_minutes: 45,
      created_at: new Date().toISOString(),
    },
    {
      id: '6',
      name: 'Peinados de Evento',
      description: 'Looks exclusivos para bodas, eventos y ocasiones especiales',
      duration_minutes: 120,
      created_at: new Date().toISOString(),
    },
    {
      id: '7',
      name: 'Mechas y Reflejos',
      description: 'Técnicas de mechas californianas y reflejos que iluminan tu rostro',
      duration_minutes: 120,
      created_at: new Date().toISOString(),
    },
    {
      id: '9',
      name: 'Alisado y Keratina',
      description: 'Tratamientos profesionales para cabello liso y sedoso',
      duration_minutes: 120,
      created_at: new Date().toISOString(),
    },
  ];

  // Cargar servicios y profesionales al montar
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [servicesRes, professionalsRes] = await Promise.all([
          fetch('/api/services').then(r => {
            if (r.ok) return r.json();
            return null;
          }).catch(() => null),
          fetch('/api/professionals').then(r => {
            if (r.ok) return r.json();
            return null;
          }).catch(() => null),
        ]);

        if (Array.isArray(servicesRes) && servicesRes.length > 0) {
          setServices(sanitizeServices(servicesRes));
        } else if (supabase) {
          // Fallback: usar supabase directamente si está disponible
          try {
            const { data } = await supabase.from('services').select('*').order('name');
            if (data && data.length > 0) {
              setServices(sanitizeServices(data));
            } else {
              setServices(sanitizeServices(defaultServices));
            }
          } catch {
            setServices(sanitizeServices(defaultServices));
          }
        } else {
          // Si no hay Supabase configurado, usar servicios por defecto
          setServices(sanitizeServices(defaultServices));
        }
        
        if (Array.isArray(professionalsRes)) {
          setProfessionals(professionalsRes);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // En caso de error, usar servicios por defecto
        setServices(sanitizeServices(defaultServices));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sanitizeServices]);

  // Cargar horarios disponibles cuando cambia la fecha o servicios
  useEffect(() => {
    if (selectedDate && selectedServices.length > 0) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, selectedServices, selectedProfessionalId]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const params = new URLSearchParams({
        date: dateStr,
        serviceIds: selectedServices.join(','),
      });
      if (selectedProfessionalId) {
        params.append('professionalId', selectedProfessionalId);
      }

      const response = await fetch(`/api/appointments/availability?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAvailableSlots(data.availableSlots || []);
      } else {
        console.error('Error loading slots:', data.error);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const validateStep = (step: FormStep): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'services':
        if (selectedServices.length === 0) {
          newErrors.services = 'Debes seleccionar al menos un servicio';
        }
        break;
      case 'date':
        if (!selectedDate) {
          newErrors.date = 'Debes seleccionar una fecha';
        }
        break;
      case 'time':
        if (!selectedTime) {
          newErrors.time = 'Debes seleccionar un horario';
        }
        break;
      case 'professional':
        // Este paso es opcional, no requiere validación
        break;
      case 'client':
        if (!clientData.name.trim()) {
          newErrors.name = 'El nombre es requerido';
        }
        if (!clientData.phone.trim()) {
          newErrors.phone = 'El teléfono es requerido';
        } else if (!isValidPhone(clientData.phone)) {
          newErrors.phone = 'Teléfono inválido';
        }
        if (!clientData.email.trim()) {
          newErrors.email = 'El email es requerido';
        } else if (!isValidEmail(clientData.email)) {
          newErrors.email = 'Email inválido';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const steps: FormStep[] = ['services', 'date', 'time', 'professional', 'client'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };

  const previousStep = () => {
    const steps: FormStep[] = ['services', 'date', 'time', 'professional', 'client'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep('client')) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: clientData.name,
          client_phone: clientData.phone,
          client_email: clientData.email,
          client_notes: clientData.notes || null,
          appointment_date: selectedDate?.toISOString(),
          appointment_time: selectedTime,
          professional_id: selectedProfessionalId || null,
          service_ids: selectedServices,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          alert('¡Turno reservado exitosamente!');
          // Resetear formulario
          setSelectedServices([]);
          setSelectedDate(null);
          setSelectedTime('');
          setSelectedProfessionalId('');
          setClientData({ name: '', phone: '', email: '', notes: '' });
          setCurrentStep('services');
        }
      } else {
        alert(data.error || 'Error al reservar el turno');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error inesperado al reservar el turno');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const steps: { key: FormStep; label: string }[] = [
    { key: 'services', label: 'Servicios' },
    { key: 'date', label: 'Fecha' },
    { key: 'time', label: 'Horario' },
    { key: 'professional', label: 'Profesional' },
    { key: 'client', label: 'Datos' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto font-sans">
      {/* Indicador de pasos */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                    {
                      'bg-accent text-accent-foreground shadow-gold-glow': index === currentStepIndex,
                      'bg-accent/20 text-accent': index < currentStepIndex,
                      'bg-secondary text-foreground/40': index > currentStepIndex,
                    }
                  )}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-sm mt-2 text-foreground/60 hidden sm:block">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    index < currentStepIndex ? 'bg-accent' : 'bg-secondary'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenido del formulario */}
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] font-sans">
        <AnimatePresence mode="wait">
          {/* Paso 1: Servicios */}
          {currentStep === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Selecciona los servicios
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      'p-4 rounded-xl text-left transition-all glass-hover',
                      selectedServices.includes(service.id)
                        ? 'bg-accent/20 border-2 border-accent'
                        : 'border-2 border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">
                          {service.name}
                        </h3>
                        <p className="text-base text-foreground/70">
                          {service.description}
                        </p>
                        <p className="text-sm text-accent mt-2">
                          Duración: {service.duration_minutes} min
                        </p>
                      </div>
                      {selectedServices.includes(service.id) && (
                        <Check className="h-5 w-5 text-accent" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {errors.services && (
                <p className="text-base text-red-400">{errors.services}</p>
              )}
            </motion.div>
          )}

          {/* Paso 2: Fecha */}
          {currentStep === 'date' && (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Selecciona una fecha
              </h2>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
              {errors.date && (
                <p className="text-base text-red-400">{errors.date}</p>
              )}
            </motion.div>
          )}

          {/* Paso 3: Horario */}
          {currentStep === 'time' && (
            <motion.div
              key="time"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Selecciona un horario
              </h2>
              {selectedDate && (
                <p className="text-xl text-foreground/70 mb-4">
                  {formatDate(selectedDate)}
                </p>
              )}
              {loadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-xl text-foreground/70 text-center py-12">
                  No hay horarios disponibles para esta fecha
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        'p-3 rounded-lg font-medium transition-all glass-hover',
                        selectedTime === slot
                          ? 'bg-accent text-accent-foreground shadow-gold-glow'
                          : 'bg-secondary text-foreground hover:bg-accent/10'
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
              {errors.time && (
                <p className="text-base text-red-400">{errors.time}</p>
              )}
            </motion.div>
          )}

          {/* Paso 4: Profesional */}
          {currentStep === 'professional' && (
            <motion.div
              key="professional"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Selecciona un profesional (opcional)
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedProfessionalId('')}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all glass-hover',
                    !selectedProfessionalId
                      ? 'bg-accent/20 border-2 border-accent'
                      : 'border-2 border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Cualquiera disponible</span>
                    {!selectedProfessionalId && (
                      <Check className="h-5 w-5 text-accent" />
                    )}
                  </div>
                </button>
                {professionals.map((professional) => (
                  <button
                    key={professional.id}
                    onClick={() => setSelectedProfessionalId(professional.id)}
                    className={cn(
                      'w-full p-4 rounded-xl text-left transition-all glass-hover',
                      selectedProfessionalId === professional.id
                        ? 'bg-accent/20 border-2 border-accent'
                        : 'border-2 border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{professional.name}</span>
                      {selectedProfessionalId === professional.id && (
                        <Check className="h-5 w-5 text-accent" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Paso 5: Datos del cliente */}
          {currentStep === 'client' && (
            <motion.div
              key="client"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Completa tus datos
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-medium mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={clientData.name}
                    onChange={(e) =>
                      setClientData({ ...clientData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Juan Pérez"
                  />
                  {errors.name && (
                    <p className="text-base text-red-400 mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) =>
                      setClientData({ ...clientData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="+54 9 3804 123456"
                  />
                  {errors.phone && (
                    <p className="text-base text-red-400 mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) =>
                      setClientData({ ...clientData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="juan@example.com"
                  />
                  {errors.email && (
                    <p className="text-base text-red-400 mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-base font-medium mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={clientData.notes}
                    onChange={(e) =>
                      setClientData({ ...clientData, notes: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    placeholder="Alguna indicación especial o preferencia..."
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            onClick={previousStep}
            disabled={currentStep === 'services'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          {currentStep === 'client' ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reservando...
                </>
              ) : (
                'Confirmar Reserva'
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

