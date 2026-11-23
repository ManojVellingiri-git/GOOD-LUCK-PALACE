// Cart state: localStorage is the day-to-day source (persists across refreshes and
// sign-out); a server-side mirror syncs for signed-in customers so the cart follows
// them across devices. Prices shown are snapshots — the server re-resolves them at
// order time, so a stale price can never be checked out.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/authContext";
import { apiDelete, apiGet, apiPut } from "@/lib/api";
import type { CartItem, CouponValidation, Product } from "@/lib/types";

const STORAGE_KEY = "glp-cart-v1";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  coupon: CouponValidation | null;
  addItem: (product: Product, qty?: number) => void;
  addItems: (items: CartItem[]) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => Promise<CouponValidation>;
  clearCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadLocal(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadLocal);
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const { user } = useAuth();
  const isSignedIn = Boolean(user);
  const hydratedFor = useRef<string | null>(null);

  // Persist locally on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full/unavailable — cart still works in memory */
    }
  }, [items]);

  // On sign-in: empty local cart → adopt the server cart; else push the local one up.
  useEffect(() => {
    if (!isSignedIn || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const server = await apiGet<{ items: CartItem[] }>("/cart");
        if (cancelled) return;
        if (server.items.length > 0 && loadLocal().length === 0) {
          setItems(server.items);
          hydratedFor.current = user.id;
        } else if (loadLocal().length > 0) {
          await apiPut("/cart", { items: loadLocal().map((i) => ({ product_id: i.product_id, qty: i.qty })) });
        }
      } catch {
        /* offline-safe: local cart keeps working */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user]);

  const sync = useCallback(
    (next: CartItem[]) => {
      if (!isSignedIn) return;
      apiPut("/cart", { items: next.map((i) => ({ product_id: i.product_id, qty: i.qty })) }).catch(() => undefined);
    },
    [isSignedIn],
  );

  const addItem = useCallback(
    (product: Product, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === product.id);
        const next = existing
          ? prev.map((i) => (i.product_id === product.id ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
          : [
              ...prev,
              {
                product_id: product.id, slug: product.slug, name: product.name, brand: product.brand,
                unit: product.unit, image_url: product.image_url, price: product.price,
                qty, available: product.available,
              },
            ];
        sync(next);
        return next;
      });
      setCoupon(null); // basket changed — revalidate at checkout
    },
    [sync],
  );

  const addItems = useCallback(
    (incoming: CartItem[]) => {
      setItems((prev) => {
        const next = [...prev];
        for (const inc of incoming) {
          const at = next.findIndex((i) => i.product_id === inc.product_id);
          if (at >= 0) next[at] = { ...next[at], qty: Math.min(99, next[at].qty + inc.qty) };
          else next.push({ ...inc, available: inc.available ?? true });
        }
        sync(next);
        return next;
      });
      setCoupon(null);
    },
    [sync],
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      setItems((prev) => {
        const next = qty <= 0 ? prev.filter((i) => i.product_id !== productId)
          : prev.map((i) => (i.product_id === productId ? { ...i, qty: Math.min(99, qty) } : i));
        sync(next);
        return next;
      });
      setCoupon(null);
    },
    [sync],
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.product_id !== productId);
        sync(next);
        return next;
      });
      setCoupon(null);
    },
    [sync],
  );

  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
    if (isSignedIn) apiDelete("/cart").catch(() => undefined);
  }, [isSignedIn]);

  const applyCoupon = useCallback(
    async (code: string) => {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })) }),
      }).then((r) => r.json() as Promise<CouponValidation>);
      setCoupon(res.valid ? res : null);
      return res;
    },
    [items],
  );

  const clearCoupon = useCallback(() => setCoupon(null), []);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.qty, 0),
    coupon,
    addItem, addItems, setQty, removeItem, clear, applyCoupon, clearCoupon,
  }), [items, coupon, addItem, addItems, setQty, removeItem, clear, applyCoupon, clearCoupon]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
