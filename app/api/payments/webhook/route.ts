import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { reconcilePayment } from '@/lib/payments';

/**
 * Webhook de MercadoPago.
 *
 * Configurar en el panel de MercadoPago > Tus integraciones > Webhooks:
 *   https://TU-DOMINIO/api/payments/webhook   (evento: "Pagos")
 *
 * Reglas de oro con MP:
 *  - responder rápido y con 200, o reintenta y termina desactivando la URL;
 *  - la notificación solo trae el id: el estado real se consulta a la API;
 *  - la misma notificación puede llegar varias veces (de ahí la idempotencia).
 */

// El webhook necesita el runtime de Node (crypto) y nunca debe cachearse.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isMercadoPagoConfigured()) {
    console.error('Webhook recibido pero MP_ACCESS_TOKEN no está configurado');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;

  // MP usa `type` en Webhooks y `topic` en el IPN viejo.
  const eventType = payload?.type || payload?.topic || searchParams.get('type') || searchParams.get('topic');

  // El id llega en data.id, o como query param en las notificaciones viejas.
  const dataId =
    payload?.data?.id?.toString() ||
    payload?.id?.toString() ||
    searchParams.get('data.id') ||
    searchParams.get('id');

  const isValid = verifyWebhookSignature({
    signatureHeader: request.headers.get('x-signature'),
    requestId: request.headers.get('x-request-id'),
    dataId,
  });

  if (!isValid) {
    console.warn('Webhook de MercadoPago con firma inválida; se descarta.');
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  // Solo nos interesan los pagos; el resto se confirma y se ignora.
  if (eventType !== 'payment') {
    return NextResponse.json({ received: true, ignored: eventType }, { status: 200 });
  }

  if (!dataId) {
    return NextResponse.json({ received: true, ignored: 'sin id' }, { status: 200 });
  }

  const result = await reconcilePayment(dataId);

  if (!result.ok) {
    // Devolvemos 200 igual: MP no distingue nuestros errores y reintentar
    // no los arregla. Queda el log para revisarlo.
    console.error(`No se pudo conciliar el pago ${dataId}: ${result.error}`);
    return NextResponse.json({ received: true, error: result.error }, { status: 200 });
  }

  return NextResponse.json({
    received: true,
    status: result.status,
    appointmentId: result.appointmentId,
    alreadyProcessed: result.alreadyProcessed ?? false,
  }, { status: 200 });
}

/** MercadoPago verifica la URL con un GET antes de habilitarla. */
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
