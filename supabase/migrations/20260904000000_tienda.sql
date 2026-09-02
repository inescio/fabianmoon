-- =====================================================================
-- Tienda: productos, órdenes y sus ítems.
--
-- Es un flujo separado del de turnos. Comparte la infraestructura de
-- cobro (preferencia, webhook, conciliación, payment_events) pero no el
-- modelo: una orden se paga entera y al instante, un turno paga una seña
-- y retiene un horario.
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Catálogo
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  price       numeric(12, 2) not null default 0 check (price >= 0),
  image_url   text,
  -- null = no se lleva control de stock para este producto.
  stock       integer check (stock is null or stock >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create unique index if not exists products_name_uniq on public.products (lower(name));

-- ---------------------------------------------------------------------
-- 2. Órdenes
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  buyer_name     text not null,
  buyer_surname  text not null,
  buyer_email    text not null,
  buyer_phone    text,
  -- MercadoPago los pide separados para el análisis de riesgo.
  buyer_doc_type text,
  buyer_doc_number text,
  total_amount   numeric(12, 2) not null default 0,
  status         text not null default 'pending',
  payment_status text not null default 'pending',
  payment_id     text,
  preference_id  text,
  payment_method text,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  constraint orders_status_check
    check (status in ('pending', 'paid', 'cancelled')),
  constraint orders_payment_status_check
    check (payment_status in ('pending', 'approved', 'rejected', 'refunded', 'expired'))
);

create index if not exists orders_payment_id_idx on public.orders (payment_id);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  -- Nombre y precio quedan congelados al momento de la compra: si después
  -- cambia la lista de precios, la orden sigue diciendo lo que se cobró.
  product_name text not null,
  unit_price   numeric(12, 2) not null check (unit_price >= 0),
  quantity     integer not null check (quantity > 0),
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- 3. payment_events sirve a los dos flujos
--
-- Nació apuntando solo a appointments. Le agregamos order_id y aflojamos
-- la exigencia: cada evento cuelga de un turno o de una orden.
-- ---------------------------------------------------------------------
alter table public.payment_events
  add column if not exists order_id uuid references public.orders (id) on delete set null;

create index if not exists payment_events_order_idx
  on public.payment_events (order_id, created_at desc);

-- ---------------------------------------------------------------------
-- 4. RLS
--
-- Mismo criterio que el resto: el catálogo es público, los datos de
-- compradores no. orders y order_items quedan sin policy, solo los
-- alcanza la service role key desde el servidor.
-- ---------------------------------------------------------------------
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "catálogo público" on public.products;
create policy "catálogo público" on public.products
  for select to anon, authenticated using (active);

-- ---------------------------------------------------------------------
-- 5. Catálogo inicial
-- ---------------------------------------------------------------------
insert into public.products (name, description, price, stock) values
  ('Shampoo Reparador 500ml',   'Nutrición profunda para cabello tratado con color o decoloración.', 18500, 25),
  ('Acondicionador Reparador 500ml', 'Desenreda y sella la cutícula. Ideal después del shampoo reparador.', 17200, 25),
  ('Máscara de Keratina 250ml',  'Tratamiento intensivo semanal para cabello dañado por calor.',      24900, 15),
  ('Aceite de Argán 100ml',      'Terminación sin enjuague. Brillo y control del frizz.',             15800, 30),
  ('Cera Modeladora Mate 100ml', 'Fijación fuerte con terminación mate. Para peinados con textura.',  12400, 40),
  ('Pomada Clásica 100ml',       'Fijación media y brillo. La de toda la vida, para peinados prolijos.', 11900, 40),
  ('Aceite para Barba 30ml',     'Suaviza la barba y calma la piel. Aroma amaderado.',                 13600, 20),
  ('Kit Barbería Fabián Moon',   'Aceite para barba, pomada clásica y peine de madera en estuche.',    38000, 10)
on conflict do nothing;
