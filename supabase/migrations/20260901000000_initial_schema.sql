-- =====================================================================
-- Esquema base: profesionales, servicios y turnos.
--
-- La migración de MercadoPago (20260902000000) corre después y agrega
-- sobre estas tablas los precios y el estado de pago.
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------
create table if not exists public.professionals (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text not null default '',
  duration_minutes integer not null default 45,
  created_at       timestamptz not null default now()
);

-- El nombre es la clave con la que se cargan los precios y con la que
-- el front hace su fallback, así que no puede repetirse.
create unique index if not exists services_name_uniq on public.services (lower(name));

create table if not exists public.appointments (
  id              uuid primary key default gen_random_uuid(),
  client_name     text not null,
  client_phone    text not null,
  client_email    text not null,
  client_notes    text,
  appointment_date date not null,
  -- Se guarda como texto en formato HH:MM, igual que los slots que genera
  -- generateTimeSlots(): así el filtro por horario es una comparación exacta
  -- y la UI lo muestra tal cual, sin los segundos que agregaría un `time`.
  appointment_time text not null,
  professional_id uuid references public.professionals (id) on delete set null,
  status          text not null default 'pending',
  created_at      timestamptz not null default now(),
  constraint appointments_time_format_check
    check (appointment_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  constraint appointments_status_check
    check (status in ('pending', 'confirmed', 'completed', 'cancelled'))
);

create table if not exists public.appointment_services (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id     uuid not null references public.services (id) on delete restrict,
  created_at     timestamptz not null default now(),
  unique (appointment_id, service_id)
);

create index if not exists appointments_date_idx
  on public.appointments (appointment_date, appointment_time);

create index if not exists appointment_services_appointment_idx
  on public.appointment_services (appointment_id);

-- ---------------------------------------------------------------------
-- 2. RLS
--
-- La anon key viaja al navegador, así que todo lo que sea legible con
-- ella es público. El catálogo lo es a propósito; los turnos NO: tienen
-- nombre, teléfono y email de clientes. Por eso appointments y
-- appointment_services quedan sin ninguna policy: solo los alcanza la
-- service role key, que se usa únicamente desde el servidor.
-- ---------------------------------------------------------------------
alter table public.professionals        enable row level security;
alter table public.services             enable row level security;
alter table public.appointments         enable row level security;
alter table public.appointment_services enable row level security;

drop policy if exists "catálogo público" on public.services;
create policy "catálogo público" on public.services
  for select to anon, authenticated using (true);

drop policy if exists "catálogo público" on public.professionals;
create policy "catálogo público" on public.professionals
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- 3. Catálogo inicial
--
-- Los mismos servicios que el front usa como fallback. Los precios son
-- de referencia: ajustalos a los reales.
-- ---------------------------------------------------------------------
insert into public.services (name, description, duration_minutes) values
  ('Corte Hombre',           'Cortes modernos y clásicos adaptados a tu estilo personal',        45),
  ('Corte Mujer',            'Estilos personalizados que realzan tu belleza natural',            45),
  ('Coloración / Balayage',  'Técnicas avanzadas de color para un look único y sofisticado',     90),
  ('Tratamientos Capilares', 'Keratina, botox capilar e hidratación profunda',                   90),
  ('Barbería Clásica',       'Afeitado tradicional y perfilado de barba con navaja',             45),
  ('Peinados de Evento',     'Looks exclusivos para bodas, eventos y ocasiones especiales',     120),
  ('Mechas y Reflejos',      'Técnicas de mechas californianas y reflejos que iluminan tu rostro', 120),
  ('Alisado y Keratina',     'Tratamientos profesionales para cabello liso y sedoso',           120)
on conflict do nothing;
