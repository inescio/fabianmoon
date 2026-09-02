import { notFound } from 'next/navigation';
import { ResultadoPagoTienda, EscenarioRetorno } from '@/components/ResultadoPagoTienda';

/**
 * Las tres URL de retorno de Checkout Pro.
 *
 *   /tienda/pago/exito      <- back_urls.success
 *   /tienda/pago/pendiente  <- back_urls.pending
 *   /tienda/pago/error      <- back_urls.failure
 *
 * MercadoPago pide una URL distinta por escenario. Cuál nos toca es solo
 * una pista de lo que MP anticipa: la pantalla verifica igual el estado
 * real contra nuestra API, porque la URL la puede escribir cualquiera.
 */

const ESCENARIOS: EscenarioRetorno[] = ['exito', 'pendiente', 'error'];

export function generateStaticParams() {
  return ESCENARIOS.map((resultado) => ({ resultado }));
}

export default async function TiendaPagoResultadoPage({
  params,
}: {
  params: Promise<{ resultado: string }>;
}) {
  const { resultado } = await params;

  if (!ESCENARIOS.includes(resultado as EscenarioRetorno)) {
    notFound();
  }

  return <ResultadoPagoTienda escenario={resultado as EscenarioRetorno} />;
}
