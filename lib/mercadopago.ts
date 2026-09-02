import crypto from 'crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

/**
 * Integración con MercadoPago Checkout Pro.
 *
 * Módulo solo de servidor: usa el access token privado.
 * NUNCA importarlo desde un componente con 'use client'.
 */

const accessToken = process.env.MP_ACCESS_TOKEN || '';

/** Secreto del webhook (Panel MP > Webhooks > "Clave secreta"). */
export const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';

const isPlaceholder = (value: string) => !value || value.includes('your_') || value.includes('TU_');

/** true si hay credenciales reales cargadas. */
export function isMercadoPagoConfigured(): boolean {
  return !isPlaceholder(accessToken);
}

/** true si estamos operando con credenciales de prueba (TEST-...). */
export function isTestMode(): boolean {
  return accessToken.startsWith('TEST-');
}

/**
 * Integrator ID del Programa de Partners de MercadoPago.
 *
 * Viaja como header `X-Integrator-Id` en cada llamada a la API y es lo
 * que atribuye la integración a la cuenta certificada. No es un secreto.
 */
const integratorId = process.env.MP_INTEGRATOR_ID || '';

export function getIntegratorId(): string | null {
  return isPlaceholder(integratorId) ? null : integratorId;
}

/**
 * Config nueva en cada llamada, a propósito.
 *
 * Los clientes del SDK hacen `this.config.options = {...options,
 * ...requestOptions}` antes de disparar el request: mutan el config que
 * reciben. Con una instancia compartida, dos compras simultáneas pueden
 * pisarse la idempotencyKey entre esa asignación y el fetch, y
 * MercadoPago devolvería la preferencia de la otra orden. Un objeto por
 * llamada sale prácticamente gratis y elimina el problema.
 */
function newConfig(): MercadoPagoConfig {
  if (!isMercadoPagoConfigured()) {
    throw new Error('MP_ACCESS_TOKEN no está configurado');
  }

  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000,
      ...(getIntegratorId() ? { integratorId } : {}),
    },
  });
}

export function getPreferenceClient(): Preference {
  return new Preference(newConfig());
}

export function getPaymentClient(): Payment {
  return new Payment(newConfig());
}

/**
 * Valida la firma del webhook (header `x-signature`).
 *
 * MercadoPago firma el manifiesto `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * con HMAC-SHA256 usando la clave secreta del webhook.
 * Doc: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 *
 * Si no hay secreto configurado devolvemos true con una advertencia, para
 * no bloquear la integración antes de que la peluquería cargue la clave.
 */
export function verifyWebhookSignature(params: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  const { signatureHeader, requestId, dataId } = params;

  if (isPlaceholder(MP_WEBHOOK_SECRET)) {
    console.warn(
      'MP_WEBHOOK_SECRET no configurado: el webhook acepta notificaciones sin validar firma.'
    );
    return true;
  }

  if (!signatureHeader || !dataId) return false;

  // Formato: "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839"
  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=').map((piece) => piece?.trim());
    if (key && value) acc[key] = value;
    return acc;
  }, {});

  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  // Dos reglas de MercadoPago sobre el manifiesto:
  //  - el id va en minúsculas cuando es alfanumérico;
  //  - el valor que no venga en la notificación se REMUEVE del manifiesto,
  //    no se interpola vacío. Un `request-id:;` daría un manifiesto
  //    distinto al que firmó MP y rechazaría todas las notificaciones.
  const manifest =
    `id:${dataId.toLowerCase()};` +
    (requestId ? `request-id:${requestId};` : '') +
    `ts:${ts};`;

  const expected = crypto
    .createHmac('sha256', MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(hash, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

/**
 * Modo binario: el pago sale aprobado o rechazado, nunca queda "en proceso".
 *
 * Tiene sentido en la tienda, donde el producto se entrega contra pago.
 * No lo usamos en la seña de un turno: ahí un pago en proceso todavía
 * sirve para retener el horario.
 */
export const MP_BINARY_MODE = process.env.MP_BINARY_MODE !== 'false';

/** Tope de cuotas que ofrece el checkout. */
export const MP_MAX_INSTALLMENTS = (() => {
  const parsed = Number(process.env.MP_MAX_INSTALLMENTS ?? 12);
  if (!Number.isFinite(parsed) || parsed < 1) return 12;
  return Math.min(24, Math.floor(parsed));
})();

/** Estados de pago de MP mapeados a los nuestros. */
export type LocalPaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'expired';

export function mapPaymentStatus(mpStatus: string | undefined | null): LocalPaymentStatus {
  switch (mpStatus) {
    case 'approved':
    case 'authorized':
      return 'approved';
    case 'in_process':
    case 'in_mediation':
    case 'pending':
      return 'pending';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    case 'rejected':
    case 'cancelled':
      return 'rejected';
    default:
      return 'pending';
  }
}

/**
 * Formatea una fecha como la espera MercadoPago: ISO 8601 con offset
 * explícito (`2026-09-02T15:04:05.000+00:00`). El sufijo `Z` no siempre
 * es aceptado por la API, así que escribimos el offset a mano.
 */
export function toMercadoPagoDate(date: Date): string {
  return `${date.toISOString().replace('Z', '')}+00:00`;
}
