import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validar que las variables no sean placeholders o estén vacías
const isValidUrl = (url: string): boolean => {
  if (!url || url.includes('your_') || url === 'your_supabase_project_url') {
    return false;
  }
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidKey = (key: string): boolean => {
  return !!(key && !key.includes('your_') && key !== 'your_supabase_anon_key' && key.length > 20);
};

let supabase: SupabaseClient | null = null;

if (isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey)) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    supabase = null;
  }
} else {
  console.warn(
    'Supabase no está configurado correctamente. ' +
    'Por favor, configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
  );
}

export { supabase };

// Tipos TypeScript para las tablas
export interface Professional {
  id: string;
  name: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_notes: string | null;
  appointment_date: string;
  appointment_time: string;
  professional_id: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  created_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  professional?: Professional | null;
  services?: Service[];
}

