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
 */

export interface ReconcileResult {
  ok: boolean;
  /** Estado local resultante del pago. */
  status?: LocalPaymentStatus;
  appointmentId?: string;
  /** true si este (pago, estado) ya se había procesado antes. */
  alreadyProcessed?: boolean;
  error?: string;
}

/** Código de Postgres para violación de índice único. */
const UNIQUE_VIOLATION = '23505';

/**
 * Trae el pago desde MercadoPago y sincroniza el turno asociado.
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

  const appointmentId =
    mpPayment.external_reference || mpPayment.metadata?.appointment_id || null;

  if (!appointmentId) {
    console.warn(`El pago ${paymentId} no tiene external_reference; se ignora.`);
    return { ok: false, error: 'El pago no está asociado a un turno' };
  }

  const status = mapPaymentStatus(mpPayment.status);

  // Idempotencia: el índice único (payment_id, status) rechaza el
  // reintento de un evento ya aplicado.
  const { error: logError } = await supabaseAdmin.from('payment_events').insert({
    appointment_id: appointmentId,
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
  // el turno quedó actualizado: el intento anterior pudo cortarse justo
  // después del insert. Seguimos igual y reaplicamos el update, que es
  // idempotente (escribe siempre el mismo estado).
  const alreadyProcessed = logError?.code === UNIQUE_VIOLATION;

  if (logError && !alreadyProcessed) {
    // El log es auditoría: si falla por otro motivo seguimos igual,
    // porque actualizar el turno importa más.
    console.error('Error registrando el evento de pago:', logError);
  }

  const { data: appointment, error: fetchError } = await supabaseAdmin
    .from('appointments')
    .select('id, status, payment_status')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appointment) {
    console.error(`Turno ${appointmentId} no encontrado para el pago ${paymentId}`);
    return { ok: false, error: 'Turno no encontrado', status, appointmentId };
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

  const { error: updateError } = await supabaseAdmin
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId);

  if (updateError) {
    console.error(`Error actualizando el turno ${appointmentId}:`, updateError);
    return { ok: false, error: 'No se pudo actualizar el turno', status, appointmentId };
  }

  return { ok: true, status, appointmentId, alreadyProcessed };
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
