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

let cachedConfig: MercadoPagoConfig | null = null;

function getConfig(): MercadoPagoConfig {
  if (!isMercadoPagoConfigured()) {
    throw new Error('MP_ACCESS_TOKEN no está configurado');
  }
  if (!cachedConfig) {
    cachedConfig = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10000 },
    });
  }
  return cachedConfig;
}

export function getPreferenceClient(): Preference {
  return new Preference(getConfig());
}

export function getPaymentClient(): Payment {
  return new Payment(getConfig());
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

  // MP exige el id en minúsculas cuando es alfanumérico.
  const normalizedId = dataId.toLowerCase();
  const manifest = `id:${normalizedId};request-id:${requestId ?? ''};ts:${ts};`;

  const expected = crypto
    .createHmac('sha256', MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(hash, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

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
