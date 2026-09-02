import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPaymentClient, mapPaymentStatus, LocalPaymentStatus } from '@/lib/mercadopago';

/**
 * Conciliación de pagos con MercadoPago.
 *
 * Se usa desde dos lugares:
 *  - el webhook, que es la fuente de verdad en producción;
 *  - la pantalla de vuelta del checkout, que consulta el estado en vivo
 *    (imprescindible en desarrollo, donde el webhook no llega a localhost,
 *    y útil en producción cuando la notificación tarda unos segundos).
 *
 * Ambos caminos son idempotentes: procesar el mismo pago dos veces no
 * cambia nada.
 *
 * Un pago puede pertenecer a un turno (seña) o a una orden de la tienda.
 * Cuál es se decide por el `external_reference`, que es lo único que
 * MercadoPago nos devuelve intacto en la notificación.
 */

/** A qué le pertenece un pago. */
export type PaymentTargetKind = 'appointment' | 'order';

export interface PaymentTarget {
  kind: PaymentTargetKind;
  id: string;
}

export interface ReconcileResult {
  ok: boolean;
  /** Estado local resultante del pago. */
  status?: LocalPaymentStatus;
  target?: PaymentTarget;
  /** Compatibilidad: sigue presente cuando el pago es de un turno. */
  appointmentId?: string;
  orderId?: string;
  /** true si este (pago, estado) ya se había registrado antes. */
  alreadyProcessed?: boolean;
  error?: string;
}

/** Código de Postgres para violación de índice único. */
const UNIQUE_VIOLATION = '23505';

/** Referencia externa que se manda a MercadoPago al crear la preferencia. */
export function buildExternalReference(target: PaymentTarget): string {
  return `${target.kind}:${target.id}`;
}

/**
 * Interpreta el `external_reference` de un pago.
 *
 * Los turnos creados antes de que existiera la tienda mandaban el uuid
 * pelado, sin prefijo: esos siguen siendo turnos.
 */
export function parseExternalReference(
  reference: string | null | undefined
): PaymentTarget | null {
  if (!reference) return null;

  const separator = reference.indexOf(':');
  if (separator > 0) {
    const kind = reference.slice(0, separator);
    const id = reference.slice(separator + 1);
    if (id && (kind === 'order' || kind === 'appointment')) {
      return { kind, id };
    }
  }

  return { kind: 'appointment', id: reference };
}

/**
 * Trae el pago desde MercadoPago y sincroniza el turno u orden asociada.
 */
export async function reconcilePayment(paymentId: string): Promise<ReconcileResult> {
  if (!supabaseAdmin) {
    return { ok: false, error: 'Supabase no está configurado' };
  }

  let mpPayment;
  try {
    mpPayment = await getPaymentClient().get({ id: paymentId });
  } catch (error) {
    console.error(`Error consultando el pago ${paymentId} en MercadoPago:`, error);
    return { ok: false, error: 'No se pudo consultar el pago en MercadoPago' };
  }

  const target =
    parseExternalReference(mpPayment.external_reference) ??
    (mpPayment.metadata?.appointment_id
      ? ({ kind: 'appointment', id: mpPayment.metadata.appointment_id } as PaymentTarget)
      : null);

  if (!target) {
    console.warn(`El pago ${paymentId} no tiene external_reference; se ignora.`);
    return { ok: false, error: 'El pago no está asociado a ninguna compra' };
  }

  const status = mapPaymentStatus(mpPayment.status);

  const { error: logError } = await supabaseAdmin.from('payment_events').insert({
    appointment_id: target.kind === 'appointment' ? target.id : null,
    order_id: target.kind === 'order' ? target.id : null,
    payment_id: String(paymentId),
    preference_id: (mpPayment as any).preference_id ?? null,
    status,
    status_detail: mpPayment.status_detail ?? null,
    amount: mpPayment.transaction_amount ?? null,
    payment_method: mpPayment.payment_method_id ?? null,
    raw: {
      mp_status: mpPayment.status,
      status_detail: mpPayment.status_detail,
      payment_type_id: (mpPayment as any).payment_type_id,
      date_approved: mpPayment.date_approved,
    },
  });

  // Que el evento ya estuviera registrado no alcanza para dar por hecho que
  // la compra quedó actualizada: el intento anterior pudo cortarse justo
  // después del insert. Seguimos igual y reaplicamos el update, que es
  // idempotente (escribe siempre el mismo estado).
  const alreadyProcessed = logError?.code === UNIQUE_VIOLATION;

  if (logError && !alreadyProcessed) {
    // El log es auditoría: si falla por otro motivo seguimos igual,
    // porque actualizar la compra importa más.
    console.error('Error registrando el evento de pago:', logError);
  }

  const result =
    target.kind === 'order'
      ? await applyToOrder(target.id, status, mpPayment, paymentId)
      : await applyToAppointment(target.id, status, mpPayment, paymentId);

  return {
    ...result,
    target,
    alreadyProcessed,
    ...(target.kind === 'appointment'
      ? { appointmentId: target.id }
      : { orderId: target.id }),
  };
}

/** Sincroniza el turno: la seña acreditada lo confirma. */
async function applyToAppointment(
  appointmentId: string,
  status: LocalPaymentStatus,
  mpPayment: any,
  paymentId: string
): Promise<ReconcileResult> {
  const { data: appointment, error: fetchError } = await supabaseAdmin!
    .from('appointments')
    .select('id, status, payment_status')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) {
    console.error(`Turno ${appointmentId} no encontrado para el pago ${paymentId}`);
    return { ok: false, error: 'Turno no encontrado', status };
  }

  const updates: Record<string, unknown> = {
    payment_status: status,
    payment_id: String(paymentId),
    payment_method: mpPayment.payment_method_id ?? null,
  };

  if (status === 'approved') {
    updates.paid_at = mpPayment.date_approved ?? new Date().toISOString();
    // El horario ya está pago: deja de vencer.
    updates.hold_expires_at = null;
    // No revivimos un turno que la peluquería ya cerró o canceló.
    if (appointment.status === 'pending') {
      updates.status = 'confirmed';
    }
  }

  if (status === 'refunded') {
    updates.status = 'cancelled';
  }

  // 'rejected' deja el turno en pending: el cliente puede reintentar el
  // pago hasta que venza el hold, y ahí el slot se libera solo.

  const { error: updateError } = await supabaseAdmin!
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId);

  if (updateError) {
    console.error(`Error actualizando el turno ${appointmentId}:`, updateError);
    return { ok: false, error: 'No se pudo actualizar el turno', status };
  }

  return { ok: true, status };
}

/** Sincroniza la orden de la tienda: se paga entera, no hay seña. */
async function applyToOrder(
  orderId: string,
  status: LocalPaymentStatus,
  mpPayment: any,
  paymentId: string
): Promise<ReconcileResult> {
  const { data: order, error: fetchError } = await supabaseAdmin!
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    console.error(`Orden ${orderId} no encontrada para el pago ${paymentId}`);
    return { ok: false, error: 'Orden no encontrada', status };
  }

  const updates: Record<string, unknown> = {
    payment_status: status,
    payment_id: String(paymentId),
    payment_method: mpPayment.payment_method_id ?? null,
  };

  if (status === 'approved') {
    updates.paid_at = mpPayment.date_approved ?? new Date().toISOString();
    if (order.status === 'pending') {
      updates.status = 'paid';
    }
  }

  if (status === 'refunded') {
    updates.status = 'cancelled';
  }

  const { error: updateError } = await supabaseAdmin!
    .from('orders')
    .update(updates)
    .eq('id', orderId);

  if (updateError) {
    console.error(`Error actualizando la orden ${orderId}:`, updateError);
    return { ok: false, error: 'No se pudo actualizar la orden', status };
  }

  return { ok: true, status };
}

/**
 * Libera los horarios de turnos que nunca se pagaron.
 *
 * Se llama antes de calcular disponibilidad y antes de crear un turno,
 * así un abandono de checkout no bloquea el horario para siempre.
 */
export async function releaseExpiredHolds(): Promise<void> {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from('appointments')
    .update({ payment_status: 'expired', status: 'cancelled' })
    .eq('payment_status', 'pending')
    .eq('status', 'pending')
    .lt('hold_expires_at', new Date().toISOString());

  if (error) {
    // No es fatal: peor caso, un horario queda tomado unos minutos de más.
    console.error('Error liberando reservas vencidas:', error);
  }
}
