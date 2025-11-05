import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidEmail, isValidPhone, combineDateTime } from '@/lib/booking-utils';

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Por favor configura las variables de entorno.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      client_name,
      client_phone,
      client_email,
      client_notes,
      appointment_date,
      appointment_time,
      professional_id,
      service_ids,
    } = body;

    // Validaciones
    if (!client_name || !client_phone || !client_email || !appointment_date || !appointment_time || !service_ids || service_ids.length === 0) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser completados' },
        { status: 400 }
      );
    }

    if (!isValidEmail(client_email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (!isValidPhone(client_phone)) {
      return NextResponse.json(
        { error: 'Teléfono inválido' },
        { status: 400 }
      );
    }

    // Validar que la fecha no sea en el pasado
    const appointmentDateTime = combineDateTime(new Date(appointment_date), appointment_time);
    const now = new Date();
    if (appointmentDateTime < now) {
      return NextResponse.json(
        { error: 'No se pueden reservar turnos en el pasado' },
        { status: 400 }
      );
    }

    // Validar disponibilidad antes de crear el turno
    const dateStr = new Date(appointment_date).toISOString().split('T')[0];
    const { data: conflictingAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('appointment_date', dateStr)
      .eq('appointment_time', appointment_time)
      .in('status', ['pending', 'confirmed']);

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      // Si hay un profesional específico, verificar si el conflicto es con ese profesional
      if (professional_id) {
        const conflictWithProfessional = conflictingAppointments.some(
          (apt: any) => apt.professional_id === professional_id
        );
        if (conflictWithProfessional) {
          return NextResponse.json(
            { error: 'El horario seleccionado no está disponible' },
            { status: 409 }
          );
        }
      } else {
        // Si no hay profesional específico, cualquier conflicto es problemático
        return NextResponse.json(
          { error: 'El horario seleccionado no está disponible' },
          { status: 409 }
        );
      }
    }

    // Crear el turno
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        client_name,
        client_phone,
        client_email,
        client_notes: client_notes || null,
        appointment_date: dateStr,
        appointment_time,
        professional_id: professional_id || null,
        status: 'pending',
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json(
        { error: 'Error al crear el turno' },
        { status: 500 }
      );
    }

    // Asociar servicios al turno
    const appointmentServices = service_ids.map((serviceId: string) => ({
      appointment_id: appointment.id,
      service_id: serviceId,
    }));

    const { error: servicesError } = await supabase
      .from('appointment_services')
      .insert(appointmentServices);

    if (servicesError) {
      console.error('Error associating services:', servicesError);
      // Intentar eliminar el turno creado si falla la asociación de servicios
      await supabase.from('appointments').delete().eq('id', appointment.id);
      return NextResponse.json(
        { error: 'Error al asociar servicios al turno' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Turno reservado exitosamente',
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al crear el turno' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Por favor configura las variables de entorno.' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const professionalId = searchParams.get('professionalId');
    const status = searchParams.get('status');

    let query = supabase
      .from('appointments')
      .select(`
        *,
        professional:professionals(*),
        services:appointment_services(
          service:services(*)
        )
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (date) {
      query = query.eq('appointment_date', date);
    }

    if (professionalId) {
      query = query.eq('professional_id', professionalId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Error al obtener turnos' },
        { status: 500 }
      );
    }

    // Transformar los datos para incluir servicios en formato más amigable
    const appointments = data?.map((apt: any) => ({
      ...apt,
      services: apt.services?.map((as: any) => as.service) || [],
    })) || [];

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener turnos' },
      { status: 500 }
    );
  }
}

