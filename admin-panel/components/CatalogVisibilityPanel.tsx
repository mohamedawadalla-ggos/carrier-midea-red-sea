"use client";

import { useMemo, useState } from "react";
import { can } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

export function CatalogVisibilityPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const editable = can(data.profile.role, "manageCatalogVisibility");
  const families = useMemo(() => data.catalogFamilies.filter((family) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    const products = data.products.filter((product) => product.family_id === family.id);
    return [family.name_en, family.name_ar, family.id, ...products.map((product) => product.model_code)].some((value) => value.toLowerCase().includes(needle));
  }), [data.catalogFamilies, data.products, query]);

  async function setFamilyVisible(id: string, visible: boolean) {
    if (!window.confirm(`${visible ? "Show" : "Hide"} this family on the live storefront?`)) return;
    setBusy(`family:${id}`); setMessage("");
    const { error } = await getSupabase().from("catalog_families").update({ visible }).eq("id", id);
    setBusy("");
    if (error) setMessage(error.message); else { setMessage("Family visibility saved. The live storefront will refresh within 60 seconds."); await refresh(); }
  }

  async function setProductVisible(modelCode: string, visible: boolean) {
    if (!window.confirm(`${visible ? "Show" : "Hide"} model ${modelCode} on the live storefront?`)) return;
    setBusy(`product:${modelCode}`); setMessage("");
    const { error } = await getSupabase().from("catalog_products").update({ visible }).eq("model_code", modelCode);
    setBusy("");
    if (error) setMessage(error.message); else { setMessage("Model visibility saved. The live storefront will refresh within 60 seconds."); await refresh(); }
  }

  const visibleFamilies = data.catalogFamilies.filter((family) => family.visible && family.status === "published").length;
  const visibleProducts = data.products.filter((product) => product.visible && product.active && product.catalog_status === "published").length;
  return <div className="panel-stack">
    <header className="page-heading"><div><p className="eyebrow">PUBLIC CATALOG</p><h2>Catalog visibility</h2><p>Control which existing families and models visitors can see on the live storefront.</p></div><div className="deployment-state"><span className="status-pill live">Live storefront control</span><small>{visibleFamilies} families · {visibleProducts} models visible</small></div></header>
    <p className="notice">Visibility changes apply without a rebuild. Visitors receive the latest state on refresh, tab focus, reconnect, or within the 60-second automatic refresh. A hidden detail page can remain in the initial static HTML until the browser finishes loading.</p>
    <label className="catalog-search">Search families or model codes<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Optimax or 53KHCT…" /></label>
    {message && <p className={message.includes("saved") ? "success" : "error"}>{message}</p>}
    <section className="catalog-family-list">{families.map((family) => {
      const products = data.products.filter((product) => product.family_id === family.id);
      const familyEnabled = family.visible && family.status === "published";
      return <article className="card catalog-family-card" key={family.id}>
        <header><div><span className={`product-brand ${family.brand}`}>{family.brand}</span><h3>{family.name_en}</h3><small dir="rtl">{family.name_ar}</small></div><label className="switch-row"><input type="checkbox" checked={family.visible} disabled={!editable || busy !== ""} onChange={(event) => setFamilyVisible(family.id, event.target.checked)} /> {family.visible ? "Visible" : "Hidden"}</label></header>
        <p><code>{family.id}</code> · {family.status}</p>
        <div className="catalog-model-list">{products.map((product) => {
          const productEligible = product.catalog_status === "published" && product.active;
          const rowEnabled = familyEnabled && productEligible;
          return <label key={product.model_code} className={!rowEnabled ? "muted switch-row" : "switch-row"}>
            <span><code>{product.model_code}</code><small>{product.capacity_hp} HP · {product.cooling_mode}{!productEligible ? ` · not eligible for public display (${product.catalog_status !== "published" ? product.catalog_status : "inactive"})` : ""}</small></span>
            <input type="checkbox" checked={product.visible} disabled={!editable || !rowEnabled || busy !== ""} onChange={(event) => setProductVisible(product.model_code, event.target.checked)} />
          </label>;
        })}</div>
      </article>;
    })}</section>
  </div>;
}
