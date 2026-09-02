'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { motion } from 'framer-motion';
import { Check, Loader2, Plus, ShoppingBag } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Product } from '@/lib/supabase';
import { formatCurrency } from '@/lib/pricing';
import { useCart } from '@/lib/cart';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export default function TiendaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agregado, setAgregado] = useState<string | null>(null);

  const { cart, count, add } = useCart();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/products', { cache: 'no-store' });
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) throw new Error(data.error || 'No pudimos cargar los productos');
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error cargando la tienda');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = (product: Product) => {
    add(product.id);
    // Confirmación breve en el propio botón: no hace falta un toast.
    setAgregado(product.id);
    setTimeout(() => setAgregado((current) => (current === product.id ? null : current)), 1200);
  };

  return (
    <div className={`${inter.variable} font-sans min-h-screen bg-black`}>
      <Navbar />

      <section className="py-16 sm:py-24 bg-background min-h-[70vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                <span className="text-gradient-gold">Tienda</span>
              </h1>
              <p className="text-foreground/70 max-w-xl">
                Los mismos productos que usamos en el salón. Comprá online y retirá
                por Fabián Moon.
              </p>
            </div>

            <Link
              href="/tienda/carrito"
              className="relative inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <ShoppingBag className="h-5 w-5" />
              Ver carrito
              {count > 0 && (
                <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-sm font-bold text-accent-foreground">
                  {count}
                </span>
              )}
            </Link>
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          )}

          {error && !loading && (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-foreground/70">{error}</p>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-foreground/70">Todavía no hay productos cargados.</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, index) => {
                const enCarrito = cart[product.id] ?? 0;
                const sinStock = product.stock !== null && product.stock <= 0;

                return (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.4) }}
                    className="glass rounded-2xl overflow-hidden flex flex-col"
                  >
                    <ProductoImagen product={product} />

                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="font-semibold text-foreground mb-1">{product.name}</h2>
                      <p className="text-base text-foreground/70 flex-1">{product.description}</p>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xl font-bold text-foreground">
                            {formatCurrency(Number(product.price))}
                          </p>
                          {product.stock !== null && product.stock <= 5 && (
                            <p className="text-sm text-accent mt-0.5">
                              {sinStock ? 'Sin stock' : `Quedan ${product.stock}`}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleAdd(product)}
                          disabled={sinStock}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {agregado === product.id ? (
                            <>
                              <Check className="h-4 w-4" />
                              Agregado
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Agregar
                            </>
                          )}
                        </button>
                      </div>

                      {enCarrito > 0 && (
                        <p className="mt-3 border-t border-border pt-3 text-sm text-foreground/60">
                          {enCarrito} en el carrito
                        </p>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

/**
 * Los productos todavía no tienen foto cargada. En vez de un placeholder
 * gris, la inicial sobre el degradé de la marca.
 */
function ProductoImagen({ product }: { product: Product }) {
  if (product.image_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={product.image_url}
        alt={product.name}
        className="h-44 w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-44 items-center justify-center bg-gradient-to-br from-accent/20 via-secondary to-background">
      <span className="text-5xl font-bold text-gradient-gold select-none">
        {product.name.trim().charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
