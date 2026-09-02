import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidEmail, isValidPhone, combineDateTime } from '@/lib/booking-utils';
import { computeBookingTotals, CURRENCY_ID, PAYMENT_HOLD_MINUTES } from '@/lib/pricing';
import {
  getPreferenceClient,
  isMercadoPagoConfigured,
  toMercadoPagoDate,
} from '@/lib/mercadopago';
import { getSiteUrl } from '@/lib/site-url';
import { releaseExpiredHolds } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    // appointments está cerrada por RLS: solo la alcanza la service role key.
    if (!supabaseAdmin) {
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

    // Los precios y la seña se calculan SIEMPRE desde la base: lo que
    // manda el navegador solo dice qué servicios se eligieron.
    const { data: selectedServices, error: servicesFetchError } = await supabaseAdmin
      .from('services')
      .select('id, name, price, requires_deposit')
      .in('id', service_ids);

    if (servicesFetchError) {
      console.error('Error obteniendo servicios:', servicesFetchError);
      return NextResponse.json(
        { error: 'Error al validar los servicios seleccionados' },
        { status: 500 }
      );
    }

    if (!selectedServices || selectedServices.length !== service_ids.length) {
      return NextResponse.json(
        { error: 'Alguno de los servicios seleccionados no existe' },
        { status: 400 }
      );
    }

    const totals = computeBookingTotals(selectedServices);

    // Un checkout abandonado no debe bloquear el horario para siempre.
    await releaseExpiredHolds();

    // Validar disponibilidad antes de crear el turno
    const dateStr = new Date(appointment_date).toISOString().split('T')[0];
    const { data: conflictingAppointments } = await supabaseAdmin
      .from('appointments')
      .select('id, professional_id')
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

    // Si hay que cobrar seña, el horario queda reservado un rato mientras
    // el cliente paga; vencido ese plazo se libera solo.
    const holdExpiresAt = totals.requiresDeposit
      ? new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60 * 1000)
      : null;

    // Crear el turno
    const { data: appointment, error: appointmentError } = await supabaseAdmin
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
        total_amount: totals.total,
        deposit_amount: totals.depositAmount,
        payment_status: totals.requiresDeposit ? 'pending' : 'not_required',
        hold_expires_at: holdExpiresAt ? holdExpiresAt.toISOString() : null,
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

    const { error: servicesError } = await supabaseAdmin
      .from('appointment_services')
      .insert(appointmentServices);

    if (servicesError) {
      console.error('Error associating services:', servicesError);
      // Intentar eliminar el turno creado si falla la asociación de servicios
      await supabaseAdmin.from('appointments').delete().eq('id', appointment.id);
      return NextResponse.json(
        { error: 'Error al asociar servicios al turno' },
        { status: 500 }
      );
    }

    // Sin seña: el flujo termina igual que siempre.
    if (!totals.requiresDeposit) {
      return NextResponse.json({
        success: true,
        requiresPayment: false,
        appointment,
        totals,
        message: 'Turno reservado exitosamente',
      }, { status: 201 });
    }

    if (!isMercadoPagoConfigured()) {
      await rollbackAppointment(appointment.id);
      return NextResponse.json(
        { error: 'Los pagos no están disponibles en este momento. Contactanos por WhatsApp para reservar.' },
        { status: 503 }
      );
    }

    // Crear la preferencia de Checkout Pro
    try {
      const siteUrl = getSiteUrl(request);
      const returnUrl = `${siteUrl}/reservar/pago`;
      const serviceNames = selectedServices.map((s: any) => s.name).join(', ');

      const preference = await getPreferenceClient().create({
        body: {
          items: [
            {
              id: appointment.id,
              title: `Seña de reserva - ${serviceNames}`.slice(0, 250),
              description: `Turno del ${dateStr} a las ${appointment_time} en Fabián Moon`.slice(0, 250),
              category_id: 'services',
              quantity: 1,
              currency_id: CURRENCY_ID,
              unit_price: totals.depositAmount,
            },
          ],
          payer: {
            name: client_name,
            email: client_email,
            phone: { number: String(client_phone) },
          },
          // Es lo que nos permite reconocer el turno en el webhook.
          external_reference: appointment.id,
          metadata: { appointment_id: appointment.id },
          back_urls: {
            success: returnUrl,
            pending: returnUrl,
            failure: returnUrl,
          },
          // MercadoPago rechaza auto_return con back_urls sin HTTPS.
          ...(siteUrl.startsWith('https://') ? { auto_return: 'approved' } : {}),
          notification_url: `${siteUrl}/api/payments/webhook`,
          statement_descriptor: 'FABIAN MOON',
          // Una seña acreditada días después no sirve para retener el
          // horario: fuera efectivo y cajeros, solo medios inmediatos.
          payment_methods: {
            excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
          },
          expires: true,
          date_of_expiration: holdExpiresAt ? toMercadoPagoDate(holdExpiresAt) : undefined,
        },
        requestOptions: { idempotencyKey: appointment.id },
      });

      const checkoutUrl = preference.init_point || preference.sandbox_init_point;

      if (!checkoutUrl) {
        throw new Error('MercadoPago no devolvió una URL de checkout');
      }

      await supabaseAdmin
        .from('appointments')
        .update({ preference_id: preference.id })
        .eq('id', appointment.id);

      return NextResponse.json({
        success: true,
        requiresPayment: true,
        checkoutUrl,
        preferenceId: preference.id,
        appointment,
        totals,
        expiresAt: holdExpiresAt?.toISOString(),
        message: 'Turno pre-reservado. Completá el pago de la seña para confirmarlo.',
      }, { status: 201 });
    } catch (error) {
      console.error('Error creando la preferencia de MercadoPago:', error);
      // No dejamos un turno colgado ocupando el horario si no se pudo cobrar.
      await rollbackAppointment(appointment.id);
      return NextResponse.json(
        { error: 'No pudimos iniciar el pago de la seña. Intentá de nuevo en unos minutos.' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al crear el turno' },
      { status: 500 }
    );
  }
}

/** Borra un turno que quedó sin poder cobrarse, para liberar el horario. */
async function rollbackAppointment(appointmentId: string): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('appointment_services').delete().eq('appointment_id', appointmentId);
    await supabaseAdmin.from('appointments').delete().eq('id', appointmentId);
  } catch (error) {
    console.error(`No se pudo revertir el turno ${appointmentId}:`, error);
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Por favor configura las variables de entorno.' },
        { status: 503 }
      );
    }

    // Que el panel no muestre como ocupados horarios que ya vencieron.
    await releaseExpiredHolds();

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const professionalId = searchParams.get('professionalId');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    let query = supabaseAdmin
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

    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
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
