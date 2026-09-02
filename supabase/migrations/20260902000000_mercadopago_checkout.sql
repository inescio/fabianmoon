-- =====================================================================
-- MercadoPago Checkout Pro: precios, señas y estado de pago
-- Ejecutar en el SQL Editor de Supabase.
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Servicios: precio y si exige seña para reservar
-- ---------------------------------------------------------------------
alter table public.services
  add column if not exists price numeric(12, 2) not null default 0,
  add column if not exists requires_deposit boolean not null default false;

comment on column public.services.price is 'Precio del servicio en ARS.';
comment on column public.services.requires_deposit is
  'Si es true, el turno solo se confirma con la seña pagada.';

-- ---------------------------------------------------------------------
-- 2. Turnos: importes y estado del pago
-- ---------------------------------------------------------------------
alter table public.appointments
  add column if not exists total_amount     numeric(12, 2) not null default 0,
  add column if not exists deposit_amount   numeric(12, 2) not null default 0,
  add column if not exists payment_status   text           not null default 'not_required',
  add column if not exists payment_id       text,
  add column if not exists preference_id    text,
  add column if not exists payment_method   text,
  add column if not exists paid_at          timestamptz,
  add column if not exists hold_expires_at  timestamptz;

comment on column public.appointments.total_amount is 'Total de los servicios al momento de reservar.';
comment on column public.appointments.deposit_amount is 'Seña efectivamente cobrada / a cobrar.';
comment on column public.appointments.hold_expires_at is
  'Hasta cuándo se reserva el horario esperando el pago. Vencido, el slot se libera.';

alter table public.appointments
  drop constraint if exists appointments_payment_status_check;

alter table public.appointments
  add constraint appointments_payment_status_check check (
    payment_status in (
      'not_required', -- ningún servicio exige seña
      'pending',      -- esperando que el cliente pague
      'approved',     -- seña acreditada
      'rejected',     -- el pago fue rechazado
      'refunded',     -- devuelto / contracargo
      'expired'       -- venció el tiempo de pago, slot liberado
    )
  );

create index if not exists appointments_payment_id_idx
  on public.appointments (payment_id);

create index if not exists appointments_slot_idx
  on public.appointments (appointment_date, appointment_time);

-- ---------------------------------------------------------------------
-- 3. Log de eventos de MercadoPago (auditoría + idempotencia del webhook)
-- ---------------------------------------------------------------------
create table if not exists public.payment_events (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments (id) on delete set null,
  payment_id     text,
  preference_id  text,
  status         text,
  status_detail  text,
  amount         numeric(12, 2),
  payment_method text,
  raw            jsonb,
  created_at     timestamptz not null default now()
);

-- MercadoPago reintenta el mismo webhook varias veces: esto evita
-- procesar dos veces el mismo (pago, estado).
create unique index if not exists payment_events_payment_status_uniq
  on public.payment_events (payment_id, status)
  where payment_id is not null;

create index if not exists payment_events_appointment_idx
  on public.payment_events (appointment_id, created_at desc);

-- El log solo se escribe desde el servidor con la service role key.
alter table public.payment_events enable row level security;

-- ---------------------------------------------------------------------
-- 4. Cargá acá los precios reales y qué servicios exigen seña
--    (ejemplo: los tratamientos largos piden seña, los cortes no)
-- ---------------------------------------------------------------------
-- update public.services set price = 15000, requires_deposit = false where name = 'Corte Hombre';
-- update public.services set price = 18000, requires_deposit = false where name = 'Corte Mujer';
-- update public.services set price = 40000, requires_deposit = true  where name = 'Coloración / Balayage';
-- update public.services set price = 38000, requires_deposit = true  where name = 'Tratamientos Capilares';
-- update public.services set price = 14000, requires_deposit = false where name = 'Barbería Clásica';
-- update public.services set price = 35000, requires_deposit = true  where name = 'Peinados de Evento';
-- update public.services set price = 45000, requires_deposit = true  where name = 'Mechas y Reflejos';
-- update public.services set price = 42000, requires_deposit = true  where name = 'Alisado y Keratina';
