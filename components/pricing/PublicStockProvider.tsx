"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadPublicStock, type PublicStockSnapshot } from "@/lib/public-stock";
import { siteConfig } from "@/lib/site-config";

const disabledStock: PublicStockSnapshot = { enabled: false, statuses: new Map() };
const PublicStockContext = createContext<PublicStockSnapshot>(disabledStock);

export function PublicStockProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState<PublicStockSnapshot>(disabledStock);

  useEffect(() => {
    let active = true;
    void loadPublicStock({ config: siteConfig.publicSupabase }).then((snapshot) => {
      if (active) setStock(snapshot);
    });
    return () => {
      active = false;
    };
  }, []);

  return <PublicStockContext.Provider value={stock}>{children}</PublicStockContext.Provider>;
}

export function usePublicStock(): PublicStockSnapshot {
  return useContext(PublicStockContext);
}
