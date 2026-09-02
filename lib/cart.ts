'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Carrito de la tienda.
 *
 * Vive en localStorage y guarda solo `{ productId: cantidad }`: nombres y
 * precios se vuelven a leer del servidor en cada pantalla, así una lista
 * de precios vieja guardada en el navegador no puede alterar lo que se
 * cobra. El servidor recalcula todo igual antes de crear la preferencia.
 */

const STORAGE_KEY = 'fabianmoon_cart';

/** Cambios propios de la pestaña: `storage` solo avisa a las otras. */
const CART_EVENT = 'fabianmoon:cart';

export type Cart = Record<string, number>;

export const MAX_QUANTITY = 99;

function read(): Cart {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    // Lo que hay en localStorage lo pudo escribir cualquiera: nos quedamos
    // solo con las entradas que tienen forma de línea de carrito.
    const clean: Cart = {};
    for (const [id, quantity] of Object.entries(parsed)) {
      const amount = Number(quantity);
      if (id && Number.isInteger(amount) && amount > 0) {
        clean[id] = Math.min(MAX_QUANTITY, amount);
      }
    }
    return clean;
  } catch {
    return {};
  }
}

function write(cart: Cart) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* modo incógnito o storage lleno: el carrito vive solo en memoria */
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function cartCount(cart: Cart): number {
  return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}

export function useCart() {
  // Arranca vacío en los dos lados para no romper la hidratación: el
  // contenido real se lee recién en el efecto.
  const [cart, setCart] = useState<Cart>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(read());
    setReady(true);

    const sync = () => setCart(read());
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const next = read();
    if (quantity <= 0) delete next[productId];
    else next[productId] = Math.min(MAX_QUANTITY, Math.floor(quantity));
    write(next);
  }, []);

  const add = useCallback((productId: string, quantity = 1) => {
    const next = read();
    next[productId] = Math.min(MAX_QUANTITY, (next[productId] ?? 0) + quantity);
    write(next);
  }, []);

  const remove = useCallback((productId: string) => {
    const next = read();
    delete next[productId];
    write(next);
  }, []);

  const clear = useCallback(() => write({}), []);

  return { cart, ready, count: cartCount(cart), add, remove, setQuantity, clear };
}
