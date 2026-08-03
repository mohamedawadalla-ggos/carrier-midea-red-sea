"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/content/site";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import { addRequestCartItem, clearRequestCart, parseRequestCart, removeRequestCartItem, REQUEST_CART_STORAGE_KEY, resolveRequestCartItems, sanitizeRequestCartItems, serializeRequestCart, updateRequestCartItem } from "@/lib/request-cart";
import type { RequestCartItem, ResolvedRequestCartItem } from "@/types/request-cart";
import { RequestCartPanel } from "@/components/cart/RequestCartPanel";
import { usePublicCatalogVisibility } from "@/components/catalog/PublicCatalogVisibilityProvider";

export type RequestCartContextValue = {
  items: RequestCartItem[];
  resolvedItems: ResolvedRequestCartItem[];
  itemCount: number;
  removedHiddenItemCount: number;
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
const staticActiveVariantIds = new Set(productVariants.filter((variant) => variant.active).map((variant) => variant.id));

export function RequestCartProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [items, setItems] = useState<RequestCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [removedHiddenItemCount, setRemovedHiddenItemCount] = useState(0);
  const visibility = usePublicCatalogVisibility();
  const activeVariantIds = useMemo(() => {
    if (visibility.status === "disabled") return staticActiveVariantIds;
    if (visibility.status !== "ready") return new Set<string>();
    return new Set(productVariants.filter((variant) => variant.active && visibility.familyIds.has(variant.familyId) && visibility.modelCodes.has(variant.modelCode)).map((variant) => variant.id));
  }, [visibility]);
  const visibleCartVariants = useMemo(() => productVariants.filter((variant) => activeVariantIds.has(variant.id)), [activeVariantIds]);
  const visibleCartFamilyIds = useMemo(() => new Set(visibleCartVariants.map((variant) => variant.familyId)), [visibleCartVariants]);
  const visibleCartFamilies = useMemo(() => productFamilies.filter((family) => visibleCartFamilyIds.has(family.id)), [visibleCartFamilyIds]);

  useEffect(() => {
    const hydrationTask = window.setTimeout(() => {
      setItems(parseRequestCart(window.localStorage.getItem(REQUEST_CART_STORAGE_KEY), staticActiveVariantIds));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTask);
  }, []);

  useEffect(() => {
    if (hydrated && (visibility.status === "ready" || visibility.status === "disabled")) window.localStorage.setItem(REQUEST_CART_STORAGE_KEY, serializeRequestCart(items, activeVariantIds));
  }, [activeVariantIds, hydrated, items, visibility.status]);

  useEffect(() => {
    if (!hydrated || (visibility.status !== "ready" && visibility.status !== "disabled")) return;
    const reconciliationTask = window.setTimeout(() => {
      const next = sanitizeRequestCartItems(items, activeVariantIds);
      if (next.length === items.length && next.every((item, index) => item.variantId === items[index]?.variantId && item.quantity === items[index]?.quantity)) return;
      const removed = items.length - next.length;
      if (removed > 0) setRemovedHiddenItemCount((count) => count + removed);
      setItems(next);
    }, 0);
    return () => window.clearTimeout(reconciliationTask);
  }, [activeVariantIds, hydrated, items, visibility.status]);

  const value = useMemo<RequestCartContextValue>(() => {
    const resolvedItems = resolveRequestCartItems(items, visibleCartVariants, visibleCartFamilies);
    return ({
    items,
    resolvedItems,
    itemCount: resolvedItems.reduce((sum, item) => sum + item.quantity, 0),
    removedHiddenItemCount,
    isOpen,
    addItem: (variantId, quantity) => setItems((current) => addRequestCartItem(current, variantId, quantity, activeVariantIds)),
    updateQuantity: (variantId, quantity) => setItems((current) => updateRequestCartItem(current, variantId, quantity, activeVariantIds)),
    removeItem: (variantId) => setItems((current) => removeRequestCartItem(current, variantId, activeVariantIds)),
    clearCart: () => setItems(clearRequestCart()),
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    toggleCart: () => setIsOpen((current) => !current),
  });
  }, [activeVariantIds, isOpen, items, removedHiddenItemCount, visibleCartFamilies, visibleCartVariants]);

  return <RequestCartContext.Provider value={value}>{children}<RequestCartPanel locale={locale} cart={value} /></RequestCartContext.Provider>;
}

export function useRequestCart(): RequestCartContextValue {
  const value = useContext(RequestCartContext);
  if (!value) throw new Error("useRequestCart must be used within RequestCartProvider");
  return value;
}
