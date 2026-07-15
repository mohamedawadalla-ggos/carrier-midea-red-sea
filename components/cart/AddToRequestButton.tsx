"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/content/site";
import { useRequestCart } from "@/components/cart/RequestCartProvider";

export function AddToRequestButton({ variantId, locale, quantity = 1, className, children }: { variantId: string; locale: Locale; quantity?: number; className?: string; children?: ReactNode }) {
  const { addItem, openCart } = useRequestCart();
  return <button type="button" className={className} onClick={() => { addItem(variantId, quantity); openCart(); }}>
    {children ?? (locale === "ar" ? "أضف إلى الطلب" : "Add to request")}
  </button>;
}

