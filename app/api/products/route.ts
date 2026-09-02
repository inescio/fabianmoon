import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Catálogo de la tienda.
 *
 * Es lectura pública: la tabla tiene una policy que deja ver los
 * productos activos con la anon key.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Por favor configura las variables de entorno.' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .select('id, sku, name, description, price, image_url, stock')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener productos' },
      { status: 500 }
    );
  }
}
