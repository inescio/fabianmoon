import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidEmail } from '@/lib/booking-utils';
import { CURRENCY_ID, roundCurrency } from '@/lib/pricing';
import {
  getPreferenceClient,
  isMercadoPagoConfigured,
  toMercadoPagoDate,
  MP_BINARY_MODE,
  MP_MAX_INSTALLMENTS,
} from '@/lib/mercadopago';
import { getSiteUrl } from '@/lib/site-url';
import { buildExternalReference } from '@/lib/payments';

/**
 * Compra de la tienda: crea la orden y devuelve el link de Checkout Pro.
 *
 * A diferencia de un turno, acá se cobra el total y no hay horario que
 * retener, así que la preferencia lleva una línea por producto con su
 * cantidad y su precio unitario reales.
 *
 * Los precios se recalculan SIEMPRE contra la base: del navegador solo
 * se acepta qué producto y cuántas unidades.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Cuánto vive el link de pago antes de vencer. */
const ORDER_EXPIRATION_HOURS = 24;

const MAX_LINES = 20;
const MAX_QUANTITY = 99;

const VALID_DOC_TYPES = ['DNI', 'CUIT', 'CUIL'];

interface CartLineInput {
  product_id?: unknown;
  quantity?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Por favor configura las variables de entorno.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      buyer_name,
      buyer_surname,
      buyer_email,
      buyer_phone_area,
      buyer_phone_number,
      buyer_doc_type,
      buyer_doc_number,
      items,
    } = body ?? {};

    // ---- Validación del comprador -----------------------------------
    if (!buyer_name?.trim() || !buyer_surname?.trim() || !buyer_email?.trim()) {
      return NextResponse.json(
        { error: 'Nombre, apellido y email son obligatorios' },
        { status: 400 }
      );
    }

    if (!isValidEmail(buyer_email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (buyer_doc_type && !VALID_DOC_TYPES.includes(buyer_doc_type)) {
      return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
    }

    // ---- Validación del carrito -------------------------------------
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    if (items.length > MAX_LINES) {
      return NextResponse.json(
        { error: `No se pueden comprar más de ${MAX_LINES} productos distintos por orden` },
        { status: 400 }
      );
    }

    // Un mismo producto repetido en dos líneas rompería el control de
    // stock, así que se consolidan antes de mirar nada.
    const quantities = new Map<string, number>();
    for (const line of items as CartLineInput[]) {
      const productId = typeof line?.product_id === 'string' ? line.product_id : null;
      const quantity = Number(line?.quantity);

      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        return NextResponse.json({ error: 'El carrito tiene líneas inválidas' }, { status: 400 });
      }

      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }

    const productIds = [...quantities.keys()];

    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, description, price, stock, active')
      .in('id', productIds);

    if (productsError) {
      console.error('Error obteniendo productos:', productsError);
      return NextResponse.json({ error: 'Error al validar el carrito' }, { status: 500 });
    }

    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Alguno de los productos del carrito ya no existe' },
        { status: 400 }
      );
    }

    const inactive = products.filter((product) => !product.active);
    if (inactive.length > 0) {
      return NextResponse.json(
        { error: `Ya no está disponible: ${inactive.map((p) => p.name).join(', ')}` },
        { status: 409 }
      );
    }

    const sinStock = products.filter((product) => {
      if (product.stock === null || product.stock === undefined) return false;
      return quantities.get(product.id)! > product.stock;
    });

    if (sinStock.length > 0) {
      return NextResponse.json(
        {
          error:
            'No tenemos stock suficiente de: ' +
            sinStock.map((p) => `${p.name} (quedan ${p.stock})`).join(', '),
        },
        { status: 409 }
      );
    }

    const lines = products.map((product) => {
      const quantity = quantities.get(product.id)!;
      const unitPrice = roundCurrency(Number(product.price));
      return {
        product,
        quantity,
        unitPrice,
        subtotal: roundCurrency(unitPrice * quantity),
      };
    });

    const total = roundCurrency(lines.reduce((sum, line) => sum + line.subtotal, 0));

    if (total <= 0) {
      return NextResponse.json(
        { error: 'El total de la compra tiene que ser mayor a cero' },
        { status: 400 }
      );
    }

    if (!isMercadoPagoConfigured()) {
      return NextResponse.json(
        { error: 'Los pagos no están disponibles en este momento. Escribinos por WhatsApp.' },
        { status: 503 }
      );
    }

    // ---- Orden ------------------------------------------------------
    const phone = [buyer_phone_area, buyer_phone_number]
      .map((part) => String(part ?? '').trim())
      .filter(Boolean)
      .join(' ');

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_name: String(buyer_name).trim(),
        buyer_surname: String(buyer_surname).trim(),
        buyer_email: String(buyer_email).trim(),
        buyer_phone: phone || null,
        buyer_doc_type: buyer_doc_type || null,
        buyer_doc_number: buyer_doc_number ? String(buyer_doc_number).trim() : null,
        total_amount: total,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creando la orden:', orderError);
      return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
    }

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
      lines.map((line) => ({
        order_id: order.id,
        product_id: line.product.id,
        product_name: line.product.name,
        unit_price: line.unitPrice,
        quantity: line.quantity,
      }))
    );

    if (itemsError) {
      console.error('Error guardando los ítems de la orden:', itemsError);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
    }

    // ---- Preferencia de Checkout Pro --------------------------------
    try {
      const siteUrl = getSiteUrl(request);
      const returnUrl = `${siteUrl}/tienda/pago`;
      const expiresAt = new Date(Date.now() + ORDER_EXPIRATION_HOURS * 60 * 60 * 1000);

      const preference = await getPreferenceClient().create({
        body: {
          // Una línea por producto, con su precio y cantidad reales: lo que
          // el comprador ve en el carrito es exactamente lo que ve en el
          // checkout.
          items: lines.map((line) => ({
            id: line.product.id,
            title: line.product.name.slice(0, 250),
            description: (line.product.description || line.product.name).slice(0, 250),
            category_id: 'beauty_care',
            quantity: line.quantity,
            currency_id: CURRENCY_ID,
            unit_price: line.unitPrice,
          })),
          payer: {
            name: String(buyer_name).trim(),
            surname: String(buyer_surname).trim(),
            email: String(buyer_email).trim(),
            ...(buyer_phone_number
              ? {
                  phone: {
                    area_code: String(buyer_phone_area ?? '').trim(),
                    number: String(buyer_phone_number).trim(),
                  },
                }
              : {}),
            ...(buyer_doc_type && buyer_doc_number
              ? {
                  identification: {
                    type: buyer_doc_type,
                    number: String(buyer_doc_number).trim(),
                  },
                }
              : {}),
          },
          external_reference: buildExternalReference({ kind: 'order', id: order.id }),
          metadata: { order_id: order.id },
          back_urls: {
            success: returnUrl,
            pending: returnUrl,
            failure: returnUrl,
          },
          // MercadoPago rechaza auto_return con back_urls sin HTTPS.
          ...(siteUrl.startsWith('https://') ? { auto_return: 'approved' } : {}),
          notification_url: `${siteUrl}/api/payments/webhook`,
          statement_descriptor: 'FABIAN MOON',
          // El producto se entrega contra pago, así que no queremos
          // órdenes colgadas esperando que se acredite un ticket.
          binary_mode: MP_BINARY_MODE,
          payment_methods: {
            installments: MP_MAX_INSTALLMENTS,
          },
          expires: true,
          date_of_expiration: toMercadoPagoDate(expiresAt),
        },
        requestOptions: { idempotencyKey: order.id },
      });

      const checkoutUrl = preference.init_point || preference.sandbox_init_point;

      if (!checkoutUrl) {
        throw new Error('MercadoPago no devolvió una URL de checkout');
      }

      await supabaseAdmin
        .from('orders')
        .update({ preference_id: preference.id })
        .eq('id', order.id);

      return NextResponse.json(
        {
          success: true,
          checkoutUrl,
          preferenceId: preference.id,
          orderId: order.id,
          total,
          expiresAt: expiresAt.toISOString(),
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creando la preferencia de MercadoPago:', error);
      // Sin link de pago la orden no sirve para nada: la borramos en vez
      // de dejarla pendiente para siempre.
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'No pudimos iniciar el pago. Intentá de nuevo en unos minutos.' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Error inesperado al crear la orden' }, { status: 500 });
  }
}
