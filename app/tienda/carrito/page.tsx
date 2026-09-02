'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { motion } from 'framer-motion';
import { Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Product } from '@/lib/supabase';
import { formatCurrency, roundCurrency } from '@/lib/pricing';
import { useCart } from '@/lib/cart';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

interface Comprador {
  nombre: string;
  apellido: string;
  email: string;
  areaTelefono: string;
  telefono: string;
  tipoDoc: string;
  numeroDoc: string;
}

const COMPRADOR_VACIO: Comprador = {
  nombre: '',
  apellido: '',
  email: '',
  areaTelefono: '',
  telefono: '',
  tipoDoc: 'DNI',
  numeroDoc: '',
};

export default function CarritoPage() {
  const { cart, ready, setQuantity, remove } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [comprador, setComprador] = useState<Comprador>(COMPRADOR_VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/products', { cache: 'no-store' });
        const data = await response.json();
        if (!cancelled && response.ok && Array.isArray(data)) setProducts(data);
      } catch {
        /* la pantalla ya muestra el carrito vacío si no hay productos */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Se cruzan las cantidades guardadas con los precios que acaba de
  // devolver el servidor: si un producto se dio de baja, desaparece.
  const lineas = useMemo(
    () =>
      products
        .filter((product) => (cart[product.id] ?? 0) > 0)
        .map((product) => {
          const cantidad = cart[product.id];
          return {
            product,
            cantidad,
            subtotal: roundCurrency(Number(product.price) * cantidad),
          };
        }),
    [products, cart]
  );

  const total = roundCurrency(lineas.reduce((sum, linea) => sum + linea.subtotal, 0));

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {};
    if (!comprador.nombre.trim()) nuevos.nombre = 'Ingresá tu nombre';
    if (!comprador.apellido.trim()) nuevos.apellido = 'Ingresá tu apellido';
    if (!comprador.email.trim()) nuevos.email = 'Ingresá tu email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(comprador.email)) {
      nuevos.email = 'El email no parece válido';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const pagar = async () => {
    setErrorPago(null);
    if (!validar()) return;

    setEnviando(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: comprador.nombre,
          buyer_surname: comprador.apellido,
          buyer_email: comprador.email,
          buyer_phone_area: comprador.areaTelefono,
          buyer_phone_number: comprador.telefono,
          buyer_doc_type: comprador.numeroDoc ? comprador.tipoDoc : undefined,
          buyer_doc_number: comprador.numeroDoc || undefined,
          items: lineas.map((linea) => ({
            product_id: linea.product.id,
            quantity: linea.cantidad,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'No pudimos iniciar el pago');
      }

      // El carrito se limpia recién cuando el pago se acredita: si acá
      // sale mal, el comprador vuelve y lo tiene intacto.
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setErrorPago(err instanceof Error ? err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  const cargando = loading || !ready;

  return (
    <div className={`${inter.variable} font-sans min-h-screen bg-black`}>
      <Navbar />

      <section className="py-16 sm:py-24 bg-background min-h-[70vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-10">
            Tu <span className="text-gradient-gold">carrito</span>
          </h1>

          {cargando && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          )}

          {!cargando && lineas.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center max-w-lg mx-auto">
              <ShoppingBag className="h-12 w-12 text-accent mx-auto mb-5" />
              <h2 className="text-xl font-bold mb-2">No hay nada en el carrito</h2>
              <p className="text-foreground/70 mb-7">
                Date una vuelta por la tienda y agregá lo que te guste.
              </p>
              <Link href="/tienda">
                <button className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                  Ir a la tienda
                </button>
              </Link>
            </div>
          )}

          {!cargando && lineas.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
              {/* Líneas del carrito */}
              <div className="glass rounded-2xl divide-y divide-border">
                {lineas.map((linea) => (
                  <motion.div
                    key={linea.product.id}
                    layout
                    className="flex flex-wrap items-center gap-4 p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-foreground">{linea.product.name}</h2>
                      <p className="text-sm text-foreground/60 mt-0.5">
                        {formatCurrency(Number(linea.product.price))} por unidad
                      </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-border">
                      <button
                        onClick={() => setQuantity(linea.product.id, linea.cantidad - 1)}
                        aria-label={`Quitar una unidad de ${linea.product.name}`}
                        className="p-2.5 text-foreground/70 transition-colors hover:text-foreground"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold tabular-nums">
                        {linea.cantidad}
                      </span>
                      <button
                        onClick={() => setQuantity(linea.product.id, linea.cantidad + 1)}
                        disabled={
                          linea.product.stock !== null && linea.cantidad >= linea.product.stock
                        }
                        aria-label={`Agregar una unidad de ${linea.product.name}`}
                        className="p-2.5 text-foreground/70 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="w-28 text-right font-semibold tabular-nums">
                      {formatCurrency(linea.subtotal)}
                    </p>

                    <button
                      onClick={() => remove(linea.product.id)}
                      aria-label={`Sacar ${linea.product.name} del carrito`}
                      className="p-2 text-foreground/40 transition-colors hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Datos y pago */}
              <div className="glass rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-accent tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="space-y-4 border-t border-border pt-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo
                      label="Nombre"
                      value={comprador.nombre}
                      onChange={(nombre) => setComprador({ ...comprador, nombre })}
                      error={errores.nombre}
                    />
                    <Campo
                      label="Apellido"
                      value={comprador.apellido}
                      onChange={(apellido) => setComprador({ ...comprador, apellido })}
                      error={errores.apellido}
                    />
                  </div>

                  <Campo
                    label="Email"
                    type="email"
                    value={comprador.email}
                    onChange={(email) => setComprador({ ...comprador, email })}
                    error={errores.email}
                  />

                  <div className="grid grid-cols-[90px_1fr] gap-3">
                    <Campo
                      label="Cód. área"
                      placeholder="380"
                      value={comprador.areaTelefono}
                      onChange={(areaTelefono) => setComprador({ ...comprador, areaTelefono })}
                    />
                    <Campo
                      label="Teléfono"
                      placeholder="4123456"
                      value={comprador.telefono}
                      onChange={(telefono) => setComprador({ ...comprador, telefono })}
                    />
                  </div>

                  <div className="grid grid-cols-[110px_1fr] gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm text-foreground/60">Documento</label>
                      <select
                        value={comprador.tipoDoc}
                        onChange={(e) => setComprador({ ...comprador, tipoDoc: e.target.value })}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="DNI">DNI</option>
                        <option value="CUIT">CUIT</option>
                        <option value="CUIL">CUIL</option>
                      </select>
                    </div>
                    <Campo
                      label="Número"
                      placeholder="30123456"
                      value={comprador.numeroDoc}
                      onChange={(numeroDoc) => setComprador({ ...comprador, numeroDoc })}
                    />
                  </div>
                </div>

                {errorPago && (
                  <p className="rounded-lg bg-red-400/10 p-3 text-base text-red-400">{errorPago}</p>
                )}

                <button
                  onClick={pagar}
                  disabled={enviando}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#009EE3] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#008FCC] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirigiendo…
                    </>
                  ) : (
                    <>Pagar con Mercado Pago</>
                  )}
                </button>

                <p className="flex items-start gap-2 text-sm text-foreground/60">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    Te llevamos al checkout de Mercado Pago. Podés pagar con tarjeta de
                    crédito, débito o dinero en cuenta. No guardamos los datos de tu tarjeta.
                  </span>
                </p>

                <Link
                  href="/tienda"
                  className="block text-center text-base text-accent hover:underline"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-foreground/60">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-secondary px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-accent ${
          error ? 'border-red-400' : 'border-border'
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
