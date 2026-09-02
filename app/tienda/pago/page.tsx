import { ResultadoPagoTienda } from '@/components/ResultadoPagoTienda';

/**
 * Vuelta del checkout sin escenario declarado.
 *
 * Queda para las órdenes creadas antes de que existieran las tres URL
 * separadas, y como destino manual si alguien guarda el link.
 */
export default function TiendaPagoPage() {
  return <ResultadoPagoTienda />;
}
