'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, Loader2, CalendarDays } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { formatCurrency } from '@/lib/pricing';
import { formatDate } from '@/lib/booking-utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/** Cuánto insistimos esperando que MercadoPago acredite el pago. */
const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2500;

interface AppointmentSummary {
  id: string;
  client_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  total_amount: number;
  deposit_amount: number;
  payment_status: string;
  services?: { id: string; name: string }[];
}

function PagoResultado() {
  const searchParams = useSearchParams();

  const appointmentId =
    searchParams.get('external_reference') || searchParams.get('appointment');
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');

  const [appointment, setAppointment] = useState<AppointmentSummary | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  const checkStatus = useCallback(async (): Promise<string | null> => {
    if (!appointmentId) return null;

    const params = new URLSearchParams({ appointment: appointmentId });
    if (paymentId) params.set('payment_id', paymentId);

    const response = await fetch(`/api/payments/status?${params}`, { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No pudimos verificar el pago');
    }

    setAppointment(data.appointment);
    setPaymentStatus(data.paymentStatus);
    return data.paymentStatus as string;
  }, [appointmentId, paymentId]);

  useEffect(() => {
    if (!appointmentId) {
      setError('No encontramos la reserva asociada a este pago.');
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
  }, [appointmentId, checkStatus]);

  if (loading) {
    return (
      <Card>
        <Loader2 className="h-14 w-14 text-accent mx-auto mb-6 animate-spin" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Confirmando tu pago…</h1>
        <p className="text-foreground/70">
          Estamos verificando la seña con MercadoPago. No cierres esta ventana.
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <XCircle className="h-14 w-14 text-red-400 mx-auto mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">No pudimos verificar el pago</h1>
        <p className="text-foreground/70 mb-8">{error}</p>
        <Actions retry />
      </Card>
    );
  }

  if (paymentStatus === 'approved') {
    return (
      <Card>
        <CheckCircle className="h-14 w-14 text-accent mx-auto mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          ¡Turno <span className="text-gradient-gold">confirmado</span>!
        </h1>
        <p className="text-foreground/70 mb-6">
          Recibimos tu seña. Te esperamos en Fabián Moon.
        </p>
        {appointment && <Detalle appointment={appointment} paid />}
        <Actions />
      </Card>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <Card>
        <Clock className="h-14 w-14 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Pago en proceso</h1>
        <p className="text-foreground/70 mb-6">
          MercadoPago todavía está procesando la seña. Apenas se acredite, tu turno
          queda confirmado y te avisamos por email. Guardá esta página para consultarlo.
        </p>
        {appointment && <Detalle appointment={appointment} />}
        <Actions />
      </Card>
    );
  }

  if (paymentStatus === 'expired') {
    return (
      <Card>
        <Clock className="h-14 w-14 text-red-400 mx-auto mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Se venció la reserva</h1>
        <p className="text-foreground/70 mb-8">
          Pasó el tiempo para abonar la seña y liberamos el horario. Podés volver a
          reservarlo si sigue disponible.
        </p>
        <Actions retry />
      </Card>
    );
  }

  // rejected, refunded o cualquier otro final no feliz
  return (
    <Card>
      <XCircle className="h-14 w-14 text-red-400 mx-auto mb-6" />
      <h1 className="text-2xl sm:text-3xl font-bold mb-3">El pago no se completó</h1>
      <p className="text-foreground/70 mb-8">
        MercadoPago rechazó la operación, así que el turno no quedó confirmado.
        Probá de nuevo con otro medio de pago o escribinos por WhatsApp.
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
      className="max-w-lg mx-auto text-center glass rounded-2xl p-6 sm:p-10"
    >
      {children}
    </motion.div>
  );
}

function Detalle({ appointment, paid }: { appointment: AppointmentSummary; paid?: boolean }) {
  const saldo = Number(appointment.total_amount) - Number(appointment.deposit_amount);

  return (
    <div className="text-left bg-secondary/40 rounded-xl p-4 sm:p-5 mb-8 space-y-2 text-base">
      <div className="flex items-center gap-2 text-foreground/90 mb-3">
        <CalendarDays className="h-4 w-4 text-accent shrink-0" />
        <span className="font-semibold">
          {formatDate(new Date(`${appointment.appointment_date}T00:00:00`))} · {appointment.appointment_time}
        </span>
      </div>
      {appointment.services && appointment.services.length > 0 && (
        <p className="text-foreground/70">
          {appointment.services.map((service) => service.name).join(', ')}
        </p>
      )}
      <div className="pt-3 border-t border-border space-y-1">
        <Row label="Total" value={formatCurrency(Number(appointment.total_amount))} />
        <Row
          label={paid ? 'Seña abonada' : 'Seña a acreditar'}
          value={formatCurrency(Number(appointment.deposit_amount))}
          highlight
        />
        <Row label="A abonar en el salón" value={formatCurrency(saldo)} />
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/60">{label}</span>
      <span className={highlight ? 'text-accent font-semibold' : 'text-foreground/90'}>
        {value}
      </span>
    </div>
  );
}

function Actions({ retry }: { retry?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      {retry && (
        <Link href="/reservar">
          <button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-3 rounded-lg transition-colors">
            Reservar de nuevo
          </button>
        </Link>
      )}
      <Link href="/">
        <button
          className={
            retry
              ? 'w-full sm:w-auto border border-border hover:bg-secondary text-foreground font-semibold px-6 py-3 rounded-lg transition-colors'
              : 'w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-3 rounded-lg transition-colors'
          }
        >
          Volver al inicio
        </button>
      </Link>
    </div>
  );
}

export default function PagoPage() {
  return (
    <div className={`${inter.variable} font-sans min-h-screen bg-black`}>
      <Navbar />
      <section className="py-16 sm:py-24 bg-background min-h-[70vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            }
          >
            <PagoResultado />
          </Suspense>
        </div>
      </section>
      <Footer />
    </div>
  );
}
