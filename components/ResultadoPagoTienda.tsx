'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Loader2, Package, XCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { formatCurrency } from '@/lib/pricing';
import { useCart } from '@/lib/cart';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

/**
 * Escenario que MercadoPago declara al redirigir.
 *
 * Es solo una pista para lo que mostramos mientras verificamos: el estado
 * que vale es el que devuelve nuestra propia API, que lo consulta contra
 * MercadoPago. La URL la puede escribir cualquiera.
 */
export type EscenarioRetorno = 'exito' | 'pendiente' | 'error';

/** Cuánto insistimos esperando que MercadoPago acredite el pago. */
const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2500;

interface OrderSummary {
  id: string;
  buyer_name: string;
  buyer_surname: string;
  total_amount: number;
  status: string;
  payment_status: string;
  items?: { id: string; product_name: string; unit_price: number; quantity: number }[];
}

function PagoResultado({ escenario }: { escenario?: EscenarioRetorno }) {
  const searchParams = useSearchParams();
  const { clear } = useCart();

  // MercadoPago vuelve con external_reference "order:<uuid>".
  const externalReference = searchParams.get('external_reference');
  const orderId =
    searchParams.get('order') ??
    (externalReference?.startsWith('order:') ? externalReference.slice('order:'.length) : null);
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  const checkStatus = useCallback(async (): Promise<string | null> => {
    if (!orderId) return null;

    const params = new URLSearchParams({ order: orderId });
    if (paymentId) params.set('payment_id', paymentId);

    const response = await fetch(`/api/payments/status?${params}`, { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'No pudimos verificar el pago');

    setOrder(data.order);
    setPaymentStatus(data.paymentStatus);
    return data.paymentStatus as string;
  }, [orderId, paymentId]);

  useEffect(() => {
    if (!orderId) {
      setError('No encontramos la compra asociada a este pago.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const status = await checkStatus();
        if (cancelled) return;

        attemptsRef.current += 1;

        // El webhook puede tardar unos segundos: reintentamos mientras
        // el pago siga en curso.
        if (status === 'pending' && attemptsRef.current < MAX_POLL_ATTEMPTS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        // Recién con el pago acreditado tiene sentido vaciar el carrito:
        // si salió rechazado, el comprador lo encuentra como lo dejó.
        if (status === 'approved') clear();

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error verificando el pago');
        setLoading(false);
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, checkStatus, clear]);

  if (loading) {
    return (
      <Card>
        <Loader2 className="mx-auto mb-6 h-14 w-14 animate-spin text-accent" />
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">
          {escenario === 'error' ? 'Revisando el pago…' : 'Confirmando tu pago…'}
        </h1>
        <p className="text-foreground/70">
          Estamos verificando la compra con Mercado Pago. No cierres esta ventana.
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <XCircle className="mx-auto mb-6 h-14 w-14 text-red-400" />
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">No pudimos verificar el pago</h1>
        <p className="mb-4 text-foreground/70">{error}</p>
        {escenario && (
          <p className="mb-8 text-base text-foreground/60">
            {escenario === 'exito'
              ? 'Mercado Pago nos redirigió como pago aprobado. Si te llegó el comprobante, la compra está hecha: escribinos y lo verificamos.'
              : escenario === 'pendiente'
                ? 'Mercado Pago nos redirigió con el pago en proceso.'
                : 'Mercado Pago nos redirigió como pago rechazado.'}
          </p>
        )}
        <Actions retry />
      </Card>
    );
  }

  if (paymentStatus === 'approved') {
    return (
      <Card>
        <CheckCircle className="mx-auto mb-6 h-14 w-14 text-accent" />
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">
          ¡Compra <span className="text-gradient-gold">confirmada</span>!
        </h1>
        <p className="mb-6 text-foreground/70">
          Recibimos tu pago. Te esperamos en el salón para que retires tu pedido.
        </p>
        {order && <Detalle order={order} />}
        <Actions />
      </Card>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <Card>
        <Clock className="mx-auto mb-6 h-14 w-14 text-yellow-400" />
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">Pago en proceso</h1>
        <p className="mb-6 text-foreground/70">
          Mercado Pago todavía está procesando la compra. Apenas se acredite te
          avisamos por email.
        </p>
        {order && <Detalle order={order} />}
        <Actions />
      </Card>
    );
  }

  if (paymentStatus === 'expired') {
    return (
      <Card>
        <Clock className="mx-auto mb-6 h-14 w-14 text-red-400" />
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">Se venció el link de pago</h1>
        <p className="mb-8 text-foreground/70">
          Pasó el tiempo para abonar esta compra. Podés volver a armarla en la tienda.
        </p>
        <Actions retry />
      </Card>
    );
  }

  // rejected, refunded o cualquier otro final no feliz
  return (
    <Card>
      <XCircle className="mx-auto mb-6 h-14 w-14 text-red-400" />
      <h1 className="mb-3 text-2xl font-bold sm:text-3xl">El pago no se completó</h1>
      <p className="mb-8 text-foreground/70">
        Mercado Pago rechazó la operación, así que la compra no quedó confirmada.
        Tu carrito sigue como lo dejaste: probá de nuevo con otro medio de pago.
      </p>
      <Actions retry />
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass mx-auto max-w-lg rounded-2xl p-6 text-center sm:p-10"
    >
      {children}
    </motion.div>
  );
}

function Detalle({ order }: { order: OrderSummary }) {
  return (
    <div className="mb-8 space-y-2 rounded-xl bg-secondary/40 p-4 text-left text-base sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-foreground/90">
        <Package className="h-4 w-4 shrink-0 text-accent" />
        <span className="font-semibold">Orden #{order.id.slice(0, 8)}</span>
      </div>

      {order.items?.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-foreground/70">
            {item.product_name}
            {item.quantity > 1 && <span className="text-foreground/50"> ×{item.quantity}</span>}
          </span>
          <span className="shrink-0 tabular-nums text-foreground/90">
            {formatCurrency(Number(item.unit_price) * item.quantity)}
          </span>
        </div>
      ))}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-semibold">Total</span>
        <span className="font-semibold tabular-nums text-accent">
          {formatCurrency(Number(order.total_amount))}
        </span>
      </div>
    </div>
  );
}

function Actions({ retry }: { retry?: boolean }) {
  const primary =
    'w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-3 rounded-lg transition-colors';
  const secondary =
    'w-full sm:w-auto border border-border hover:bg-secondary text-foreground font-semibold px-6 py-3 rounded-lg transition-colors';

  return (
    <div className="flex flex-col justify-center gap-3 sm:flex-row">
      {retry && (
        <Link href="/tienda/carrito">
          <button className={primary}>Volver al carrito</button>
        </Link>
      )}
      <Link href="/tienda">
        <button className={retry ? secondary : primary}>Seguir comprando</button>
      </Link>
    </div>
  );
}

export function ResultadoPagoTienda({ escenario }: { escenario?: EscenarioRetorno }) {
  return (
    <div className={`${inter.variable} font-sans min-h-screen bg-black`}>
      <Navbar />
      <section className="min-h-[70vh] bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            }
          >
            <PagoResultado escenario={escenario} />
          </Suspense>
        </div>
      </section>
      <Footer />
    </div>
  );
}
