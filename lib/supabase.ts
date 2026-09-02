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
  /** Precio en ARS. 0 mientras no se haya cargado. */
  price: number;
  /** Si es true, el turno solo se confirma con la seña pagada. */
  requires_deposit: boolean;
  created_at: string;
}

export type PaymentStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'expired';

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
  /** Total de los servicios al momento de reservar. */
  total_amount: number;
  /** Seña cobrada / a cobrar por MercadoPago. */
  deposit_amount: number;
  payment_status: PaymentStatus;
  /** ID del pago en MercadoPago. */
  payment_id: string | null;
  /** ID de la preferencia de Checkout Pro. */
  preference_id: string | null;
  payment_method: string | null;
  paid_at: string | null;
  /** Hasta cuándo se reserva el horario esperando el pago. */
  hold_expires_at: string | null;
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

// --- Tienda ----------------------------------------------------------

export interface Product {
  id: string;
  name: string;
  description: string;
  /** Precio en ARS. */
  price: number;
  image_url: string | null;
  /** null = no se lleva control de stock para este producto. */
  stock: number | null;
  active?: boolean;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string | null;
  /** Nombre y precio congelados al momento de la compra. */
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: string;
  buyer_name: string;
  buyer_surname: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_doc_type: string | null;
  buyer_doc_number: string | null;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  payment_status: Exclude<PaymentStatus, 'not_required'>;
  payment_id: string | null;
  preference_id: string | null;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  items?: OrderItem[];
}
