#!/usr/bin/env node
/**
 * Diagnóstico de la conexión con MercadoPago.
 *
 *   npm run check:mp
 *
 * Revisa, en orden, todo lo que tiene que estar en pie para que se pueda
 * cobrar una seña: variables de entorno, esquema de Supabase, precios
 * cargados, credenciales de MercadoPago y URL pública para el webhook.
 *
 * No mueve plata ni escribe en la base: solo lee. Lo único que crea es una
 * preferencia de prueba (un link de checkout que nadie va a abrir) para
 * confirmar que la API acepta el payload real de la app.
 */

import fs from 'node:fs';
import path from 'node:path';

const ENV_FILE = '.env.local';

let failures = 0;
let warnings = 0;

const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const warn = (msg) => { warnings++; console.log(`  \x1b[33m!\x1b[0m ${msg}`); };
const fail = (msg) => { failures++; console.log(`  \x1b[31m✗\x1b[0m ${msg}`); };
const section = (title) => console.log(`\n\x1b[1m${title}\x1b[0m`);

/** Un valor que quedó como el del .env.example no sirve de nada. */
const isPlaceholder = (value) =>
  !value || /xxx|your_|TU_|0000000|eyJhbGciOi\.\.\./i.test(value);

function loadEnv() {
  const file = path.resolve(process.cwd(), ENV_FILE);
  if (!fs.existsSync(file)) {
    console.error(`No existe ${ENV_FILE}. Copiá .env.example y completalo.`);
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();

// ---------------------------------------------------------------------
section('1. Variables de entorno');
// ---------------------------------------------------------------------
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'MP_ACCESS_TOKEN',
  'NEXT_PUBLIC_SITE_URL',
];

for (const key of required) {
  if (isPlaceholder(env[key])) fail(`${key} sin completar (sigue el valor de ejemplo)`);
  else ok(`${key} cargada`);
}

if (isPlaceholder(env.MP_WEBHOOK_SECRET)) {
  warn('MP_WEBHOOK_SECRET vacía: el webhook acepta notificaciones sin validar la firma');
} else {
  ok('MP_WEBHOOK_SECRET cargada');
}

const siteUrl = (env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
if (siteUrl.startsWith('https://')) {
  ok(`NEXT_PUBLIC_SITE_URL es HTTPS (${siteUrl})`);
} else {
  warn(
    `NEXT_PUBLIC_SITE_URL no es HTTPS (${siteUrl || 'vacía'}): MercadoPago no puede ` +
    'entregar el webhook ni usar auto_return. Sirve para probar en local, no para producción.'
  );
}

// ---------------------------------------------------------------------
section('2. Supabase: esquema y precios');
// ---------------------------------------------------------------------
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Rol que declara una clave de Supabase.
 *
 * Importa distinguirlas: con RLS activo, usar la anon key donde va la
 * service role no da error — devuelve vacío en silencio, que es mucho
 * peor de diagnosticar.
 */
function roleOf(key) {
  if (!key) return null;
  if (key.startsWith('sb_secret_')) return 'service_role';
  if (key.startsWith('sb_publishable_')) return 'anon';
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
    return payload.role ?? null;
  } catch {
    return null;
  }
}

if (!isPlaceholder(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  const role = roleOf(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (role === 'anon') ok('NEXT_PUBLIC_SUPABASE_ANON_KEY es la clave anónima');
  else if (role === 'service_role') {
    fail('NEXT_PUBLIC_SUPABASE_ANON_KEY tiene la SERVICE ROLE: esa clave viaja al navegador, cambiala ya');
  } else warn(`No pude leer el rol de NEXT_PUBLIC_SUPABASE_ANON_KEY (${role ?? 'desconocido'})`);
}

if (!isPlaceholder(env.SUPABASE_SERVICE_ROLE_KEY)) {
  const role = roleOf(env.SUPABASE_SERVICE_ROLE_KEY);
  if (role === 'service_role') ok('SUPABASE_SERVICE_ROLE_KEY es la service role');
  else {
    fail(
      `SUPABASE_SERVICE_ROLE_KEY no es la service role (rol: ${role ?? 'desconocido'}). ` +
      'Con RLS activo, los turnos y los pagos van a fallar en silencio.'
    );
  }
}

async function supabaseGet(query) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, body };
}

let services = null;

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseKey)) {
  fail('Supabase sin configurar: no se puede verificar el esquema');
} else {
  try {
    const result = await supabaseGet(
      'services?select=id,name,price,requires_deposit&order=name'
    );
    if (result.ok) {
      services = result.body;
      ok('services tiene las columnas price y requires_deposit');
    } else {
      fail(
        `services: ${result.body?.message || result.status}. ` +
        '¿Corriste supabase/migrations/20260902000000_mercadopago_checkout.sql?'
      );
    }

    const appointments = await supabaseGet(
      'appointments?select=id,payment_status,total_amount,deposit_amount,payment_id,preference_id,paid_at,hold_expires_at&limit=1'
    );
    if (appointments.ok) ok('appointments tiene las columnas de pago');
    else fail(`appointments: ${appointments.body?.message || appointments.status}`);

    const events = await supabaseGet('payment_events?select=id,order_id&limit=1');
    if (events.ok) ok('payment_events existe y sirve a los dos flujos');
    else fail(`payment_events: ${events.body?.message || events.status}`);

    const productos = await supabaseGet('products?select=id,name,price,stock,active');
    if (productos.ok) {
      const activos = (productos.body || []).filter((p) => p.active !== false);
      if (activos.length === 0) warn('La tienda no tiene productos activos');
      else ok(`Tienda: ${activos.length} productos activos`);

      const sinPrecio = activos.filter((p) => Number(p.price) <= 0);
      if (sinPrecio.length > 0) {
        fail(`Productos sin precio: ${sinPrecio.map((p) => p.name).join(', ')}`);
      }
    } else {
      fail(
        `products: ${productos.body?.message || productos.status}. ` +
        '¿Corriste supabase/migrations/20260904000000_tienda.sql?'
      );
    }

    const ordenes = await supabaseGet('orders?select=id,payment_status&limit=1');
    if (ordenes.ok) ok('orders existe y es legible');
    else fail(`orders: ${ordenes.body?.message || ordenes.status}`);
  } catch (error) {
    fail(`No se pudo consultar Supabase: ${error.message}`);
  }
}

if (Array.isArray(services)) {
  const conDeposito = services.filter((s) => s.requires_deposit);
  const sinPrecio = services.filter((s) => Number(s.price) <= 0);

  if (services.length === 0) {
    warn('No hay servicios cargados');
  } else if (conDeposito.length === 0) {
    warn(
      'Ningún servicio tiene requires_deposit = true: nunca se va a cobrar una seña. ' +
      'Los UPDATE de ejemplo están al final del archivo de migración.'
    );
  } else {
    ok(`${conDeposito.length} de ${services.length} servicios exigen seña`);
  }

  // Un servicio con seña pero sin precio no puede cobrar nada.
  const rotos = conDeposito.filter((s) => Number(s.price) <= 0);
  if (rotos.length > 0) {
    fail(`Servicios con seña pero sin precio: ${rotos.map((s) => s.name).join(', ')}`);
  }
  if (sinPrecio.length > 0 && rotos.length !== sinPrecio.length) {
    warn(`Servicios sin precio cargado: ${sinPrecio.map((s) => s.name).join(', ')}`);
  }
}

// ---------------------------------------------------------------------
section('3. MercadoPago: credenciales');
// ---------------------------------------------------------------------
const token = env.MP_ACCESS_TOKEN;
let credencialesOk = false;

if (isPlaceholder(token)) {
  fail('MP_ACCESS_TOKEN sin completar');
} else {
  try {
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await response.json();

    if (!response.ok) {
      fail(`El token fue rechazado (${response.status}): ${user.message || user.error}`);
    } else {
      credencialesOk = true;
      const esPrueba = (user.tags || []).includes('test_user');
      ok(`Token válido — cuenta ${user.nickname} (${user.site_id})`);
      if (esPrueba) {
        ok('Usuario de prueba: es lo esperado mientras se homologa con MercadoPago Partners');
      } else {
        warn('Cuenta PRODUCTIVA: los pagos son reales y se cobran de verdad');
      }
      if (user.site_id !== 'MLA') {
        warn(`La cuenta es de ${user.site_id} pero se cobra en ARS (MLA)`);
      }

      // La clave pública tiene que ser de la misma cuenta que el token:
      // si no, el botón del SDK no puede abrir la preferencia.
      const publicKey = env.NEXT_PUBLIC_MP_PUBLIC_KEY;
      if (isPlaceholder(publicKey)) {
        warn(
          'NEXT_PUBLIC_MP_PUBLIC_KEY sin cargar: el checkout funciona por ' +
          'redirección, pero sin el botón oficial del SDK de front-end'
        );
      } else if (!publicKey.startsWith('APP_USR-') && !publicKey.startsWith('TEST-')) {
        fail('NEXT_PUBLIC_MP_PUBLIC_KEY no parece una clave pública de MercadoPago');
      } else {
        ok('NEXT_PUBLIC_MP_PUBLIC_KEY cargada (el SDK de front-end renderiza el botón)');
      }
    }
  } catch (error) {
    fail(`No se pudo contactar a MercadoPago: ${error.message}`);
  }
}

// ---------------------------------------------------------------------
section('4. MercadoPago: creación de preferencia');
// ---------------------------------------------------------------------
if (!credencialesOk) {
  warn('Se saltea: hacen falta credenciales válidas');
} else {
  const expira = new Date(Date.now() + 30 * 60 * 1000);
  const returnUrl = `${siteUrl}/reservar/pago`;

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `diagnostico-${Date.now()}`,
      },
      body: JSON.stringify({
        // Dos líneas con cantidades distintas: es el caso de la tienda y
        // el que más campos del checklist de calidad pone a prueba.
        items: [
          {
            id: 'diagnostico-1',
            title: 'Producto de diagnóstico A',
            description: 'Línea de prueba con cantidad mayor a uno',
            category_id: 'beauty_care',
            quantity: 2,
            currency_id: 'ARS',
            unit_price: 1000,
          },
          {
            id: 'diagnostico-2',
            title: 'Producto de diagnóstico B',
            description: 'Segunda línea de prueba',
            category_id: 'beauty_care',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: 2500,
          },
        ],
        payer: {
          name: 'Diagnóstico',
          surname: 'De Prueba',
          email: 'diagnostico@testuser.com',
          phone: { area_code: '380', number: '4123456' },
          identification: { type: 'DNI', number: '30123456' },
        },
        binary_mode: true,
        external_reference: 'order:diagnostico',
        back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
        ...(siteUrl.startsWith('https://') ? { auto_return: 'approved' } : {}),
        notification_url: `${siteUrl}/api/payments/webhook`,
        statement_descriptor: 'FABIAN MOON',
        payment_methods: { installments: 12 },
        expires: true,
        date_of_expiration: `${expira.toISOString().replace('Z', '')}+00:00`,
      }),
    });
    const preference = await response.json();

    if (response.ok) {
      ok('MercadoPago acepta el payload de checkout de la app');
      const totalMp = (preference.items || []).reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );
      if (totalMp === 4500) ok('Los importes del carrito llegan intactos al checkout');
      else fail(`El total en MercadoPago es ${totalMp} y debería ser 4500`);
      console.log(`      link de prueba: ${preference.init_point}`);
    } else {
      fail(
        `MercadoPago rechazó la preferencia (${response.status}): ` +
        `${preference.message || JSON.stringify(preference.cause || preference)}`
      );
    }
  } catch (error) {
    fail(`Error creando la preferencia: ${error.message}`);
  }
}

// ---------------------------------------------------------------------
section('5. Webhook');
// ---------------------------------------------------------------------
const webhookUrl = `${siteUrl}/api/payments/webhook`;

if (!siteUrl.startsWith('https://')) {
  warn(`Con ${siteUrl} MercadoPago no puede entregar notificaciones.`);
  console.log('      Para probar en local: ngrok http 3000 y poné esa URL en NEXT_PUBLIC_SITE_URL.');
} else {
  try {
    const response = await fetch(webhookUrl, { method: 'GET' });
    if (response.ok) ok(`${webhookUrl} responde 200`);
    else fail(`${webhookUrl} respondió ${response.status}`);
  } catch (error) {
    fail(`No se pudo alcanzar ${webhookUrl}: ${error.message}`);
  }
  console.log(`      Registralo en el panel de MercadoPago > Webhooks (evento "Pagos")`);
  console.log(`      y copiá la clave secreta a MP_WEBHOOK_SECRET.`);
}

// ---------------------------------------------------------------------
console.log(
  failures === 0
    ? `\n\x1b[32mListo\x1b[0m — sin errores${warnings ? `, ${warnings} advertencia(s)` : ''}.\n`
    : `\n\x1b[31m${failures} problema(s)\x1b[0m${warnings ? ` y ${warnings} advertencia(s)` : ''} que resolver.\n`
);

process.exit(failures === 0 ? 0 : 1);
