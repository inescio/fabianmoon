import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateTimeSlots, timeToMinutes, calculateTotalDuration } from '@/lib/booking-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const serviceIds = searchParams.get('serviceIds')?.split(',').filter(Boolean) || [];
    const professionalId = searchParams.get('professionalId');

    if (!date) {
      return NextResponse.json(
        { error: 'Fecha es requerida' },
        { status: 400 }
      );
    }

    const selectedDate = new Date(date);
    
    // Obtener todos los servicios seleccionados para calcular duración total
    let totalDuration = 45; // Duración por defecto
    
    // Si Supabase está configurado, intentar obtener duraciones reales
    if (supabase && serviceIds.length > 0) {
      try {
        const { data: services } = await supabase
          .from('services')
          .select('duration_minutes')
          .in('id', serviceIds);

        if (services && services.length > 0) {
          const durations = services.map(s => s.duration_minutes);
          totalDuration = calculateTotalDuration(durations);
        }
      } catch (error) {
        // Si falla, usar duración por defecto
        console.warn('Error fetching service durations, using default:', error);
      }
    } else if (serviceIds.length > 0) {
      // Si no hay Supabase, usar duración por defecto basada en cantidad de servicios
      totalDuration = serviceIds.length * 45; // 45 minutos por servicio
    }

    // Generar todos los slots posibles para ese día
    const allSlots = generateTimeSlots(selectedDate);

    // Devolver todos los slots disponibles sin filtrar por turnos ocupados
    return NextResponse.json({
      availableSlots: allSlots,
      totalDuration,
      date: selectedDate.toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener disponibilidad' },
      { status: 500 }
    );
  }
}

