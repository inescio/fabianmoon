import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Cliente de Supabase para uso exclusivo del servidor.
 *
 * `appointments`, `appointment_services` y `payment_events` tienen RLS
 * activo y ninguna policy para anon: los datos de los clientes no son
 * públicos y la anon key viaja al navegador. Todo el acceso del servidor
 * a esas tablas pasa por acá, con la service role key.
 *
 * NUNCA importar este módulo desde un componente con 'use client'.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isUsableKey = (key: string): boolean =>
  !!key && !key.includes('your_') && key.length > 20;

let adminClient: SupabaseClient | null = null;

if (supabaseUrl && isUsableKey(serviceRoleKey)) {
  try {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (error) {
    console.error('Error creando el cliente admin de Supabase:', error);
    adminClient = null;
  }
} else if (supabaseUrl) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY no está configurada. Se cae a la clave anónima, ' +
    'que RLS bloquea en appointments y payment_events: los turnos y los pagos ' +
    'van a fallar hasta que la cargues.'
  );
}

/** Cliente con permisos de servidor, o el anónimo como fallback. */
export const supabaseAdmin: SupabaseClient | null = adminClient ?? supabase;

/** true si estamos usando realmente la service role key. */
export const hasServiceRoleKey = adminClient !== null;
