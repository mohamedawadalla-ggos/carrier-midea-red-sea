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
    if (!window.confirm(`${visible ? "Show" : "Hide"} this family on the next storefront deployment?`)) return;
    setBusy(`family:${id}`); setMessage("");
    const { error } = await getSupabase().from("catalog_families").update({ visible }).eq("id", id);
    setBusy("");
    if (error) setMessage(error.message); else { setMessage("Family visibility saved. Storefront rebuild required."); await refresh(); }
  }

  async function setProductVisible(modelCode: string, visible: boolean) {
    if (!window.confirm(`${visible ? "Show" : "Hide"} model ${modelCode} on the next storefront deployment?`)) return;
    setBusy(`product:${modelCode}`); setMessage("");
    const { error } = await getSupabase().from("catalog_products").update({ visible }).eq("model_code", modelCode);
    setBusy("");
    if (error) setMessage(error.message); else { setMessage("Model visibility saved. Storefront rebuild required."); await refresh(); }
  }

  const visibleFamilies = data.catalogFamilies.filter((family) => family.visible && family.status === "published").length;
  const visibleProducts = data.products.filter((product) => product.visible && product.active && product.catalog_status === "published").length;
  const latestCatalogChange = Math.max(0, ...data.catalogFamilies.map((family) => Date.parse(family.updated_at)), ...data.products.map((product) => Date.parse(product.updated_at)));
  const pendingDeployment = latestCatalogChange > Date.parse(data.catalogDeploymentState.last_deployed_at);

  async function markDeployed() {
    if (!window.confirm("Only continue after the matching storefront build has been deployed to production. Mark this catalog snapshot as deployed?")) return;
    setBusy("deployment"); setMessage("");
    const { error } = await getSupabase().from("catalog_storefront_deployment_state").update({ last_deployed_at: new Date().toISOString(), updated_by: data.profile.user_id }).eq("singleton", true);
    setBusy("");
    if (error) setMessage(error.message); else { setMessage("Catalog snapshot marked as deployed."); await refresh(); }
  }

  return <div className="panel-stack">
    <header className="page-heading"><div><p className="eyebrow">PUBLIC CATALOG</p><h2>Catalog visibility</h2><p>Control what is included in the next static storefront deployment.</p></div><div className="deployment-state"><span className={`status-pill ${pendingDeployment ? "pending" : "live"}`}>{pendingDeployment ? "Pending storefront deployment" : "Published"}</span><small>{visibleFamilies} families · {visibleProducts} models visible</small>{editable && pendingDeployment && <button type="button" className="secondary" disabled={busy !== ""} onClick={markDeployed}>Mark manual deployment complete</button>}</div></header>
    <p className="notice">Visibility changes are saved immediately in Supabase, but the static storefront must be rebuilt and deployed before its pages change.</p>
    <label className="catalog-search">Search families or model codes<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Optimax or 53KHCT…" /></label>
    {message && <p className={message.includes("saved") ? "success" : "error"}>{message}</p>}
    <section className="catalog-family-list">{families.map((family) => {
      const products = data.products.filter((product) => product.family_id === family.id);
      const familyEnabled = family.visible && family.status === "published";
      return <article className="card catalog-family-card" key={family.id}>
        <header><div><span className={`product-brand ${family.brand}`}>{family.brand}</span><h3>{family.name_en}</h3><small dir="rtl">{family.name_ar}</small></div><label className="switch-row"><input type="checkbox" checked={family.visible} disabled={!editable || busy !== ""} onChange={(event) => setFamilyVisible(family.id, event.target.checked)} /> {family.visible ? "Visible" : "Hidden"}</label></header>
        <p><code>{family.id}</code> · {family.status}</p>
        <div className="catalog-model-list">{products.map((product) => <label key={product.model_code} className={!familyEnabled ? "muted switch-row" : "switch-row"}>
          <span><code>{product.model_code}</code><small>{product.capacity_hp} HP · {product.cooling_mode}</small></span>
          <input type="checkbox" checked={product.visible} disabled={!editable || !familyEnabled || busy !== ""} onChange={(event) => setProductVisible(product.model_code, event.target.checked)} />
        </label>)}</div>
      </article>;
    })}</section>
  </div>;
}
