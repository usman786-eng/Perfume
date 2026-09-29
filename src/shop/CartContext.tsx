import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product, Size } from './products';

export type CartItem = {
  key: string;
  slug: string;
  name: string;
  ml: number;
  price: number;
  qty: number;
  image: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  addItem: (product: Product, size: Size, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'dayrah-cart-v1';

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem => Boolean(item && typeof item.key === 'string' && typeof item.price === 'number' && typeof item.qty === 'number'));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — the bag simply lives for the session */
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.qty, 0),
    subtotal: items.reduce((total, item) => total + item.qty * item.price, 0),
    isOpen,
    openBag: () => setIsOpen(true),
    closeBag: () => setIsOpen(false),
    addItem: (product, size, qty = 1) => {
      const key = `${product.slug}-${size.ml}`;
      setItems((current) => {
        const existing = current.find((item) => item.key === key);
        if (existing) {
          return current.map((item) => item.key === key ? { ...item, qty: Math.min(9, item.qty + qty) } : item);
        }
        return [...current, { key, slug: product.slug, name: product.name, ml: size.ml, price: size.price, qty, image: product.image }];
      });
      setIsOpen(true);
    },
    setQty: (key, qty) => setItems((current) => qty <= 0 ? current.filter((item) => item.key !== key) : current.map((item) => item.key === key ? { ...item, qty: Math.min(9, qty) } : item)),
    removeItem: (key) => setItems((current) => current.filter((item) => item.key !== key)),
    clear: () => setItems([]),
  }), [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
