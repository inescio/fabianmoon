/**
 * Cálculo de precios y señas.
 *
 * Esta lógica se usa en el cliente (para mostrar el desglose) y en el
 * servidor (que es quien manda: recalcula todo desde la base antes de
 * cobrar, nunca confía en los importes que llegan del navegador).
 */

/** Porcentaje del total que se cobra como seña. */
export const DEPOSIT_PERCENTAGE = clampPercentage(
  Number(process.env.NEXT_PUBLIC_DEPOSIT_PERCENTAGE ?? 30)
);

/** Minutos que se mantiene reservado el horario esperando el pago. */
export const PAYMENT_HOLD_MINUTES = Math.max(
  5,
  Number(process.env.NEXT_PUBLIC_PAYMENT_HOLD_MINUTES ?? 30) || 30
);

export const CURRENCY_ID = 'ARS';

function clampPercentage(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 30;
  return Math.min(100, value);
}

/** Redondea a 2 decimales evitando los artefactos de punto flotante. */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Lo mínimo que se puede cobrar en el desglose de una reserva. */
export const MIN_DEPOSIT_AMOUNT = 1;

export interface PriceableService {
  price?: number | string | null;
  requires_deposit?: boolean | null;
}

export interface BookingTotals {
  /** Suma de los servicios seleccionados. */
  total: number;
  /** Si algún servicio exige seña para reservar. */
  requiresDeposit: boolean;
  /** Importe a pagar ahora por MercadoPago (0 si no se exige seña). */
  depositAmount: number;
  /** Lo que queda por abonar en el salón. */
  balance: number;
  /** Porcentaje aplicado, para mostrarlo en pantalla. */
  depositPercentage: number;
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = typeof value === 'string' ? Number(value) : value ?? 0;
  return Number.isFinite(parsed) ? (parsed as number) : 0;
}

/**
 * Calcula total, seña y saldo de una selección de servicios.
 *
 * La seña se exige si *al menos uno* de los servicios elegidos la
 * requiere, y se calcula como un porcentaje del total de la reserva.
 */
export function computeBookingTotals(services: PriceableService[]): BookingTotals {
  const total = roundCurrency(
    services.reduce((sum, service) => sum + toNumber(service.price), 0)
  );

  const requiresDeposit = services.some((service) => service.requires_deposit === true);

  let depositAmount = 0;
  if (requiresDeposit && total > 0) {
    depositAmount = Math.min(
      total,
      Math.max(MIN_DEPOSIT_AMOUNT, roundCurrency((total * DEPOSIT_PERCENTAGE) / 100))
    );
  }

  return {
    total,
    // Sin precios cargados no hay nada que cobrar: la reserva sigue sin pago.
    requiresDeposit: requiresDeposit && depositAmount > 0,
    depositAmount,
    balance: roundCurrency(total - depositAmount),
    depositPercentage: DEPOSIT_PERCENTAGE,
  };
}

/** Formatea un importe en pesos argentinos. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: CURRENCY_ID,
    minimumFractionDigits: 0,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** Etiqueta legible para el estado de pago de un turno. */
export function getPaymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'approved':
      return 'Seña pagada';
    case 'pending':
      return 'Pago pendiente';
    case 'rejected':
      return 'Pago rechazado';
    case 'refunded':
      return 'Reintegrado';
    case 'expired':
      return 'Pago vencido';
    case 'not_required':
      return 'Sin seña';
    default:
      return status || '—';
  }
}
