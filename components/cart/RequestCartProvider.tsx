"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/content/site";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import { addRequestCartItem, clearRequestCart, parseRequestCart, removeRequestCartItem, REQUEST_CART_STORAGE_KEY, resolveRequestCartItems, serializeRequestCart, updateRequestCartItem } from "@/lib/request-cart";
import type { RequestCartItem, ResolvedRequestCartItem } from "@/types/request-cart";
import { RequestCartPanel } from "@/components/cart/RequestCartPanel";

export type RequestCartContextValue = {
  items: RequestCartItem[];
  resolvedItems: ResolvedRequestCartItem[];
  itemCount: number;
  isOpen: boolean;
  addItem: (variantId: string, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const RequestCartContext = createContext<RequestCartContextValue | null>(null);
const activeVariantIds = new Set(productVariants.filter((variant) => variant.active).map((variant) => variant.id));

export function RequestCartProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [items, setItems] = useState<RequestCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hydrationTask = window.setTimeout(() => {
      setItems(parseRequestCart(window.localStorage.getItem(REQUEST_CART_STORAGE_KEY), activeVariantIds));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTask);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(REQUEST_CART_STORAGE_KEY, serializeRequestCart(items, activeVariantIds));
  }, [hydrated, items]);

  const value = useMemo<RequestCartContextValue>(() => ({
    items,
    resolvedItems: resolveRequestCartItems(items, productVariants, productFamilies),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    isOpen,
    addItem: (variantId, quantity) => setItems((current) => addRequestCartItem(current, variantId, quantity, activeVariantIds)),
    updateQuantity: (variantId, quantity) => setItems((current) => updateRequestCartItem(current, variantId, quantity, activeVariantIds)),
    removeItem: (variantId) => setItems((current) => removeRequestCartItem(current, variantId, activeVariantIds)),
    clearCart: () => setItems(clearRequestCart()),
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    toggleCart: () => setIsOpen((current) => !current),
  }), [isOpen, items]);

  return <RequestCartContext.Provider value={value}>{children}<RequestCartPanel locale={locale} cart={value} /></RequestCartContext.Provider>;
}

export function useRequestCart(): RequestCartContextValue {
  const value = useContext(RequestCartContext);
  if (!value) throw new Error("useRequestCart must be used within RequestCartProvider");
  return value;
}
