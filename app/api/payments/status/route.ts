import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPaymentClient, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { reconcilePayment } from '@/lib/payments';

/**
 * Estado de pago de un turno, para la pantalla de vuelta del checkout.
 *
 * GET /api/payments/status?appointment=<uuid>&payment_id=<id opcional>
 *
 * No alcanza con esperar el webhook: en desarrollo nunca llega a localhost
 * y en producción puede demorar unos segundos. Si el turno sigue pendiente,
 * este endpoint consulta MercadoPago y concilia en el momento.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase no está configurado' },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const appointmentId = searchParams.get('appointment');
  const paymentIdParam = searchParams.get('payment_id') || searchParams.get('collection_id');

  if (!appointmentId) {
    return NextResponse.json(
      { error: 'Falta el identificador del turno' },
      { status: 400 }
    );
  }

  const loadAppointment = async () =>
    supabaseAdmin!
      .from('appointments')
      .select(`
        id, client_name, client_email, appointment_date, appointment_time, status,
        total_amount, deposit_amount, payment_status, payment_method, paid_at, hold_expires_at,
        services:appointment_services(service:services(id, name, price))
      `)
      .eq('id', appointmentId)
      .single();

  let { data: appointment, error } = await loadAppointment();

  if (error || !appointment) {
    return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
  }

  // Si todavía figura pendiente, preguntamos directo a MercadoPago.
  if (appointment.payment_status === 'pending' && isMercadoPagoConfigured()) {
    let paymentId = paymentIdParam;

    // El navegador no siempre vuelve con el payment_id (por ejemplo si el
    // cliente cerró la pestaña): lo buscamos por external_reference.
    if (!paymentId) {
      try {
        const search = await getPaymentClient().search({
          options: {
            external_reference: appointmentId,
            sort: 'date_created',
            criteria: 'desc',
            limit: 5,
          },
        });
        // Priorizamos un pago aprobado sobre uno rechazado anterior.
        const results = search.results ?? [];
        const approved = results.find((p) => p.status === 'approved');
        paymentId = (approved?.id ?? results[0]?.id)?.toString() ?? null;
      } catch (searchError) {
        console.error('Error buscando pagos del turno:', searchError);
      }
    }

    if (paymentId) {
      const result = await reconcilePayment(paymentId);
      if (result.ok) {
        const refreshed = await loadAppointment();
        if (refreshed.data) appointment = refreshed.data;
      }
    }
  }

  return NextResponse.json({
    appointment: {
      ...appointment,
      services: (appointment as any).services?.map((as: any) => as.service) || [],
    },
    paymentStatus: appointment.payment_status,
    status: appointment.status,
  });
}
