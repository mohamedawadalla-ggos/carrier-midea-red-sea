"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadPublicPricing, type PublicPricingSnapshot } from "@/lib/public-pricing";
import { siteConfig } from "@/lib/site-config";

const disabledPricing: PublicPricingSnapshot = { enabled: false, prices: new Map() };
const PublicPricingContext = createContext<PublicPricingSnapshot>(disabledPricing);

export function PublicPricingProvider({ children }: { children: ReactNode }) {
  const [pricing, setPricing] = useState<PublicPricingSnapshot>(disabledPricing);

  useEffect(() => {
    let active = true;
    void loadPublicPricing({ config: siteConfig.publicSupabase }).then((snapshot) => {
      if (active) setPricing(snapshot);
    });
    return () => {
      active = false;
    };
  }, []);

  return <PublicPricingContext.Provider value={pricing}>{children}</PublicPricingContext.Provider>;
}

export function usePublicPricing(): PublicPricingSnapshot {
  return useContext(PublicPricingContext);
}
