import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPaymentClient, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { reconcilePayment, buildExternalReference, PaymentTarget } from '@/lib/payments';

/**
 * Estado de pago de un turno o de una orden, para la pantalla de vuelta
 * del checkout.
 *
 * GET /api/payments/status?appointment=<uuid>[&payment_id=<id>]
 * GET /api/payments/status?order=<uuid>[&payment_id=<id>]
 *
 * No alcanza con esperar el webhook: en desarrollo nunca llega a localhost
 * y en producción puede demorar unos segundos. Si sigue pendiente, este
 * endpoint consulta MercadoPago y concilia en el momento.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const appointmentId = searchParams.get('appointment');
  const orderId = searchParams.get('order');
  const paymentIdParam = searchParams.get('payment_id') || searchParams.get('collection_id');

  const target: PaymentTarget | null = orderId
    ? { kind: 'order', id: orderId }
    : appointmentId
      ? { kind: 'appointment', id: appointmentId }
      : null;

  if (!target) {
    return NextResponse.json(
      { error: 'Falta el identificador del turno o de la orden' },
      { status: 400 }
    );
  }

  const isOrder = target.kind === 'order';

  // Cada consulta va con su select inline: el parser de tipos de Supabase
  // necesita verlo literal para inferir la forma del resultado.
  const loadOrder = async () =>
    supabaseAdmin!
      .from('orders')
      .select(`
        id, buyer_name, buyer_surname, buyer_email, total_amount, status,
        payment_status, payment_method, paid_at, created_at,
        items:order_items(id, product_name, unit_price, quantity)
      `)
      .eq('id', target.id)
      .single();

  const loadAppointment = async () =>
    supabaseAdmin!
      .from('appointments')
      .select(`
        id, client_name, client_email, appointment_date, appointment_time, status,
        total_amount, deposit_amount, payment_status, payment_method, paid_at, hold_expires_at,
        services:appointment_services(service:services(id, name, price))
      `)
      .eq('id', target.id)
      .single();

  const load = async (): Promise<{ data: any; error: unknown }> =>
    isOrder ? await loadOrder() : await loadAppointment();

  let { data: record, error } = await load();

  if (error || !record) {
    return NextResponse.json(
      { error: isOrder ? 'Orden no encontrada' : 'Turno no encontrado' },
      { status: 404 }
    );
  }

  // Si todavía figura pendiente, preguntamos directo a MercadoPago.
  if (record.payment_status === 'pending' && isMercadoPagoConfigured()) {
    let paymentId = paymentIdParam;

    // El navegador no siempre vuelve con el payment_id (por ejemplo si el
    // comprador cerró la pestaña): lo buscamos por external_reference.
    if (!paymentId) {
      try {
        const search = await getPaymentClient().search({
          options: {
            external_reference: buildExternalReference(target),
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
        console.error('Error buscando pagos:', searchError);
      }
    }

    if (paymentId) {
      const result = await reconcilePayment(paymentId);
      if (result.ok) {
        const refreshed = await load();
        if (refreshed.data) record = refreshed.data;
      }
    }
  }

  if (isOrder) {
    return NextResponse.json({
      order: record,
      paymentStatus: record.payment_status,
      status: record.status,
    });
  }

  return NextResponse.json({
    appointment: {
      ...record,
      services: record.services?.map((as: any) => as.service) || [],
    },
    paymentStatus: record.payment_status,
    status: record.status,
  });
}
