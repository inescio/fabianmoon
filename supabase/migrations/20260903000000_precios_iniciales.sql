-- =====================================================================
-- Precios y qué servicios exigen seña.
--
-- Son los mismos valores que el front usa como fallback, para que la
-- base y la pantalla digan lo mismo. AJUSTAR a los precios reales de la
-- peluquería: es el único lugar que manda a la hora de cobrar.
--
-- Criterio: los trabajos largos y con insumos piden seña; los cortes y
-- la barbería se pagan enteros en el salón.
-- =====================================================================

update public.services set price = 15000, requires_deposit = false where lower(name) = lower('Corte Hombre');
update public.services set price = 18000, requires_deposit = false where lower(name) = lower('Corte Mujer');
update public.services set price = 40000, requires_deposit = true  where lower(name) = lower('Coloración / Balayage');
update public.services set price = 38000, requires_deposit = true  where lower(name) = lower('Tratamientos Capilares');
update public.services set price = 14000, requires_deposit = false where lower(name) = lower('Barbería Clásica');
update public.services set price = 35000, requires_deposit = true  where lower(name) = lower('Peinados de Evento');
update public.services set price = 45000, requires_deposit = true  where lower(name) = lower('Mechas y Reflejos');
update public.services set price = 42000, requires_deposit = true  where lower(name) = lower('Alisado y Keratina');
