import { notFound } from 'next/navigation';
import { ResultadoPagoTurno, EscenarioRetorno } from '@/components/ResultadoPagoTurno';

/**
 * Las tres URL de retorno de la seña.
 *
 *   /reservar/pago/exito      <- back_urls.success
 *   /reservar/pago/pendiente  <- back_urls.pending
 *   /reservar/pago/error      <- back_urls.failure
 */

const ESCENARIOS: EscenarioRetorno[] = ['exito', 'pendiente', 'error'];

export function generateStaticParams() {
  return ESCENARIOS.map((resultado) => ({ resultado }));
}

export default async function ReservarPagoResultadoPage({
  params,
}: {
  params: Promise<{ resultado: string }>;
}) {
  const { resultado } = await params;

  if (!ESCENARIOS.includes(resultado as EscenarioRetorno)) {
    notFound();
  }

  return <ResultadoPagoTurno escenario={resultado as EscenarioRetorno} />;
}
