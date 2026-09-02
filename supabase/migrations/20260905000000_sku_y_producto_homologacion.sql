-- =====================================================================
-- SKU de productos y producto para la simulación de pago de MercadoPago.
--
-- El desafío de Partners pide que el ítem que viaja en la preferencia
-- lleve un id de 4 dígitos, una imagen y una descripción determinada.
-- El UUID del producto no sirve como id de ítem, así que se agrega un
-- SKU corto, que además es lo que usaría cualquier e-commerce.
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SKU
-- ---------------------------------------------------------------------
create sequence if not exists public.products_sku_seq start 1001;

alter table public.products
  add column if not exists sku text;

-- Los productos que ya existían se numeran por antigüedad.
update public.products
   set sku = lpad(nextval('public.products_sku_seq')::text, 4, '0')
 where sku is null;

alter table public.products
  alter column sku set default lpad(nextval('public.products_sku_seq')::text, 4, '0');

alter table public.products
  alter column sku set not null;

alter table public.products
  drop constraint if exists products_sku_format_check;

-- Cuatro dígitos exactos, como pide la simulación. Da para 8999 productos
-- desde el 1001; si alguna vez hicieran falta más, hay que ampliar esto.
alter table public.products
  add constraint products_sku_format_check check (sku ~ '^[0-9]{4}$');

create unique index if not exists products_sku_uniq on public.products (sku);

comment on column public.products.sku is
  'Código corto del producto. Viaja como `id` del ítem en la preferencia de MercadoPago.';

comment on column public.products.image_url is
  'Foto del producto. Puede ser relativa (/foto.jpg): la ruta de órdenes la '
  'convierte en absoluta contra la URL del sitio antes de mandarla a MercadoPago.';

-- ---------------------------------------------------------------------
-- 2. Producto de la simulación de pago
--
-- La descripción es literal la que exige el desafío de MercadoPago.
-- Antes de que la peluquería salga en vivo con su catálogo real, este
-- producto se da de baja con:
--   update public.products set active = false where sku = '9001';
-- ---------------------------------------------------------------------
insert into public.products (sku, name, description, price, image_url, stock, active)
values (
  '9001',
  'Terminal de Venta Móvil',
  'Dispositivo de tienda móvil de comercio electrónico',
  25000,
  '/moon5.jpg',
  50,
  true
)
on conflict do nothing;
