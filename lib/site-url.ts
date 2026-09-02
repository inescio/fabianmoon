/**
 * URL pública del sitio.
 *
 * La usan las back_urls y el notification_url de MercadoPago, y el
 * metadataBase de Open Graph. Tiene que ser una sola: si se separan,
 * los previews de links apuntan a un lado y los pagos vuelven a otro.
 *
 * Orden de preferencia:
 *  1. NEXT_PUBLIC_SITE_URL — el dominio estable, el único que sirve para
 *     registrar el webhook en MercadoPago.
 *  2. VERCEL_URL — cambia en cada deploy, así que sirve para previews
 *     pero no para el webhook.
 *  3. El origen del request, cuando hay uno.
 */

const isPlaceholder = (value: string | undefined): boolean =>
  !value || value.includes('your_') || value.includes('TU_');

export function getSiteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!isPlaceholder(configured)) {
    return configured!.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (request) {
    try {
      return new URL(request.url).origin;
    } catch {
      /* ignorar */
    }
  }

  return 'http://localhost:3000';
}
