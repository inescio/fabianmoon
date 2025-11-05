/**
 * Utilidades para el sistema de reservas de turnos
 */

// Horarios del salón
export const SALON_HOURS = {
  tuesday: { open: 9, close: 20 },
  wednesday: { open: 9, close: 20 },
  thursday: { open: 9, close: 20 },
  friday: { open: 9, close: 20 },
  saturday: { open: 9, close: 18 },
  sunday: null, // Cerrado
  monday: null, // Cerrado
} as const;

// Intervalo de tiempo en minutos
export const TIME_INTERVAL_MINUTES = 45;

// Días máximos hacia adelante para reservar
export const MAX_DAYS_AHEAD = 60;

/**
 * Genera intervalos de tiempo disponibles según los horarios del salón
 * @param date - Fecha para la cual generar los horarios
 * @returns Array de strings con formato HH:MM
 */
export function generateTimeSlots(date: Date): string[] {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  
  let hours: { open: number; close: number } | null = null;
  
  switch (dayOfWeek) {
    case 1: // Lunes
      return []; // Cerrado
    case 2: // Martes
      hours = SALON_HOURS.tuesday;
      break;
    case 3: // Miércoles
      hours = SALON_HOURS.wednesday;
      break;
    case 4: // Jueves
      hours = SALON_HOURS.thursday;
      break;
    case 5: // Viernes
      hours = SALON_HOURS.friday;
      break;
    case 6: // Sábado
      hours = SALON_HOURS.saturday;
      break;
    case 0: // Domingo
      return []; // Cerrado
    default:
      return [];
  }

  if (!hours) return [];

  const slots: string[] = [];
  const totalMinutes = (hours.close - hours.open) * 60;
  const numSlots = Math.floor(totalMinutes / TIME_INTERVAL_MINUTES);

  for (let i = 0; i < numSlots; i++) {
    const hoursValue = hours.open + Math.floor((i * TIME_INTERVAL_MINUTES) / 60);
    const minutesValue = (i * TIME_INTERVAL_MINUTES) % 60;
    const timeString = `${hoursValue.toString().padStart(2, '0')}:${minutesValue.toString().padStart(2, '0')}`;
    slots.push(timeString);
  }

  return slots;
}

/**
 * Valida si una fecha está disponible para reservar
 * @param date - Fecha a validar
 * @returns true si la fecha es válida, false en caso contrario
 */
export function isDateAvailable(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  // No permitir fechas pasadas
  if (checkDate < today) {
    return false;
  }

  // No permitir más de MAX_DAYS_AHEAD días hacia adelante
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
  if (checkDate > maxDate) {
    return false;
  }

  // Validar día de la semana
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 1) {
    return false; // Domingo y Lunes cerrado
  }

  return true;
}

/**
 * Calcula la duración total de los servicios seleccionados
 * @param serviceDurations - Array con las duraciones en minutos de cada servicio
 * @returns Duración total en minutos
 */
export function calculateTotalDuration(serviceDurations: number[]): number {
  return serviceDurations.reduce((total, duration) => total + duration, 0);
}

/**
 * Formatea una fecha para mostrarla en el calendario
 * @param date - Fecha a formatear
 * @returns String con formato legible
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Convierte un string de hora (HH:MM) a minutos desde medianoche
 * @param timeString - String con formato HH:MM
 * @returns Minutos desde medianoche
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a string de hora (HH:MM)
 * @param minutes - Minutos desde medianoche
 * @returns String con formato HH:MM
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Obtiene el nombre del día de la semana en español
 * @param date - Fecha
 * @returns Nombre del día en español
 */
export function getDayName(date: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

/**
 * Valida formato de email
 * @param email - Email a validar
 * @returns true si el formato es válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de teléfono (permite números, espacios, guiones y paréntesis)
 * @param phone - Teléfono a validar
 * @returns true si el formato es válido
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
}

/**
 * Genera un array de fechas disponibles para los próximos MAX_DAYS_AHEAD días
 * @returns Array de fechas disponibles
 */
export function getAvailableDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < MAX_DAYS_AHEAD; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    if (isDateAvailable(date)) {
      dates.push(date);
    }
  }

  return dates;
}

/**
 * Combina fecha y hora en un objeto Date
 * @param date - Fecha
 * @param timeString - Hora en formato HH:MM
 * @returns Objeto Date combinado
 */
export function combineDateTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

