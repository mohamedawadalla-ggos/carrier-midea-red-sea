"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { productFamilies } from "@/content/product-families";
import { productVariants } from "@/content/product-variants";
import { disabledCatalogVisibility, loadPublicCatalogVisibility, loadingCatalogVisibility, type PublicCatalogVisibilitySnapshot } from "@/lib/public-catalog-visibility";
import { siteConfig } from "@/lib/site-config";
import type { ProductFamily, ProductVariant } from "@/types/catalog";

const REFRESH_INTERVAL_MS = 60_000;
const knownFamilyIds = new Set(productFamilies.map((family) => family.id));
const knownModelCodes = new Set(productVariants.map((variant) => variant.modelCode));
const knownModelFamilies = new Map(productVariants.map((variant) => [variant.modelCode, variant.familyId]));
const PublicCatalogVisibilityContext = createContext<PublicCatalogVisibilitySnapshot>(disabledCatalogVisibility());

export function PublicCatalogVisibilityProvider({ children }: { children: ReactNode }) {
  if (!siteConfig.liveCatalogVisibilityEnabled) return <PublicCatalogVisibilityContext.Provider value={disabledCatalogVisibility()}>{children}</PublicCatalogVisibilityContext.Provider>;
  return <EnabledPublicCatalogVisibilityProvider>{children}</EnabledPublicCatalogVisibilityProvider>;
}

function EnabledPublicCatalogVisibilityProvider({ children }: { children: ReactNode }) {
  // Keep the static export intact for crawlers and the first HTTP response.
  // The browser switches to fail-closed loading as soon as hydration completes.
  const [snapshot, setSnapshot] = useState<PublicCatalogVisibilitySnapshot>(disabledCatalogVisibility);
  const requestRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const next = await loadPublicCatalogVisibility({
      enabled: true,
      config: siteConfig.publicSupabase,
      knownFamilyIds,
      knownModelCodes,
      knownModelFamilies,
      signal: controller.signal,
    });
    if (!controller.signal.aborted) setSnapshot(next);
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      setSnapshot(loadingCatalogVisibility());
      void refresh();
    }, 0);
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    const onFocus = () => void refresh();
    const onOnline = () => void refresh();
    const onVisibilityChange = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      requestRef.current?.abort();
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  return <PublicCatalogVisibilityContext.Provider value={snapshot}>{children}</PublicCatalogVisibilityContext.Provider>;
}

export function usePublicCatalogVisibility(): PublicCatalogVisibilitySnapshot {
  return useContext(PublicCatalogVisibilityContext);
}

export function useVisibleCatalog(families: ProductFamily[], variants: ProductVariant[]) {
  const snapshot = usePublicCatalogVisibility();
  return useMemo(() => {
    if (snapshot.status === "disabled") return { status: snapshot.status, families, variants };
    if (snapshot.status !== "ready") return { status: snapshot.status, families: [], variants: [] };
    const visibleFamilies = families.filter((family) => snapshot.familyIds.has(family.id));
    const visibleFamilyIds = new Set(visibleFamilies.map((family) => family.id));
    const visibleVariants = variants.filter((variant) => visibleFamilyIds.has(variant.familyId) && snapshot.modelCodes.has(variant.modelCode));
    return { status: snapshot.status, families: visibleFamilies, variants: visibleVariants };
  }, [families, snapshot, variants]);
}
