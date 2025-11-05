import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado. Por favor configura las variables de entorno.' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching professionals:', error);
      return NextResponse.json(
        { error: 'Error al obtener profesionales' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al obtener profesionales' },
      { status: 500 }
    );
  }
}

