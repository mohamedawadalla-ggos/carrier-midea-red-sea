"use client";

import { useMemo, useState, type FormEvent } from "react";
import { can, findEditablePriceEntry, findPublishablePriceEntry } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import { formatMoney, inputToMinor, minorToInput } from "@/lib/money";
import { getSupabase } from "@/lib/supabase";

export function PricesPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [selectedCode, setSelectedCode] = useState(data.products[0]?.model_code ?? "");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const product = data.products.find((item) => item.model_code === selectedCode);
  const editableEntry = findEditablePriceEntry(data.priceEntries, selectedCode, data.profile);
  const publishableEntry = findPublishablePriceEntry(data.priceEntries, selectedCode, data.profile.role);
  const latestEntry = data.priceEntries.find((item) => item.model_code === selectedCode);
  const published = data.publishedPrices.find((item) => item.model_code === selectedCode);
  const visible = useMemo(
    () => data.products.filter((item) => `${item.model_code} ${item.family_name_en}`.toLowerCase().includes(query.toLowerCase())),
    [data.products, query],
  );

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const status = form.get("submitForApproval") === "on" ? "pending_approval" : "draft";
      const payload = {
        model_code: selectedCode,
        currency: "EGP",
        end_user_price_minor: inputToMinor(String(form.get("endUser"))),
        dealer_cost_minor: inputToMinor(String(form.get("dealerCost"))),
        minimum_price_minor: String(form.get("minimum")) ? inputToMinor(String(form.get("minimum"))) : null,
        tax_included: form.get("taxIncluded") === "on",
        effective_from: String(form.get("effectiveFrom")),
        expires_at: String(form.get("expiresAt")) || null,
        source_reference: String(form.get("sourceReference")),
        status,
      };
      const supabase = getSupabase();
      const result = editableEntry
        ? await supabase
          .from("product_price_entries")
          .update(payload)
          .eq("id", editableEntry.id)
          .in("status", ["draft", "pending_approval"])
          .select("id")
          .single()
        : await supabase.from("product_price_entries").insert(payload).select("id").single();
      if (result.error) throw result.error;
      setMessage(status === "pending_approval" ? "Price submitted for approval." : "Price draft saved.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save price.");
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    let approvedNow = false;
    try {
      if (!publishableEntry) throw new Error("Submit a price entry for approval before publishing.");
      const listPrice = publishableEntry.end_user_price_minor;
      const salePrice = inputToMinor(String(form.get("salePrice")));
      if (salePrice > listPrice) throw new Error("Sale price cannot exceed list price.");
      if (publishableEntry.minimum_price_minor !== null && salePrice < publishableEntry.minimum_price_minor) {
        throw new Error("Sale price is below the approved minimum.");
      }
      const action = publishableEntry.status === "pending_approval" ? "approve this price entry and publish it" : "publish this approved customer price";
      if (!window.confirm("Confirm you want to " + action + " for " + selectedCode + ". This changes the public price.")) return;

      const supabase = getSupabase();
      if (publishableEntry.status === "pending_approval") {
        const approval = await supabase
          .from("product_price_entries")
          .update({ status: "approved", approved_by: data.profile.user_id })
          .eq("id", publishableEntry.id)
          .eq("status", "pending_approval")
          .select("id")
          .single();
        if (approval.error) throw approval.error;
        approvedNow = true;
      }

      const { error } = await supabase.from("published_product_prices").upsert({
        model_code: selectedCode,
        currency: publishableEntry.currency,
        list_price_minor: listPrice,
        sale_price_minor: salePrice,
        discount_label_ar: String(form.get("labelAr")) || null,
        discount_label_en: String(form.get("labelEn")) || null,
        effective_from: publishableEntry.effective_from,
        expires_at: publishableEntry.expires_at,
        published: true,
        published_by: data.profile.user_id,
      });
      if (error) throw error;
      setMessage("Public price published.");
      await refresh();
    } catch (error) {
      if (approvedNow) await refresh().catch(() => undefined);
      const detail = error instanceof Error ? error.message : "Unable to publish price.";
      setMessage(approvedNow ? `Price approved, but publication failed: ${detail} Retry publication.` : detail);
    }
  }

  return <div className="panel-stack">
    <header className="page-heading"><div><p className="eyebrow">PRICE BOOK</p><h2>Prices and public discounts</h2></div><span className="status-pill">Dealer cost stays private</span></header>
    <div className="split-layout">
      <aside className="list-card"><input aria-label="Search products" className="search" placeholder="Search model or family" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="model-list">{visible.map((item) => { const price = data.publishedPrices.find((candidate) => candidate.model_code === item.model_code); return <button className={selectedCode === item.model_code ? "active" : ""} key={item.model_code} onClick={() => setSelectedCode(item.model_code)}><span><b>{item.model_code}</b><small>{item.family_name_en} · {item.capacity_hp} HP</small></span><em>{price ? formatMoney(price.sale_price_minor, price.currency) : "Request quote"}</em></button>; })}</div>
      </aside>
      <section className="editor-stack">
        <article className="card"><h3>{product?.family_name_en}</h3><p className="muted">{selectedCode} · {product?.brand.toUpperCase()} · {product?.capacity_hp} HP · {product?.refrigerant}</p>
          {latestEntry && !editableEntry && can(data.profile.role, "editPriceDrafts") && <p className="muted">Latest history status: {latestEntry.status.replaceAll("_", " ")}. Saving below creates a new draft; final history remains unchanged.</p>}
          {can(data.profile.role, "editPriceDrafts") ? <form key={`draft-${selectedCode}-${editableEntry?.updated_at ?? "new"}`} className="form-grid" onSubmit={saveDraft}>
            <label>End-user list price (EGP)<input name="endUser" inputMode="decimal" defaultValue={minorToInput(editableEntry?.end_user_price_minor)} required /></label>
            <label>Private dealer cost (EGP)<input name="dealerCost" inputMode="decimal" defaultValue={minorToInput(editableEntry?.dealer_cost_minor)} required /></label>
            <label>Minimum approved price<input name="minimum" inputMode="decimal" defaultValue={minorToInput(editableEntry?.minimum_price_minor)} /></label>
            <label>Source reference<input name="sourceReference" defaultValue={editableEntry?.source_reference ?? ""} required /></label>
            <label>Effective from<input name="effectiveFrom" type="date" defaultValue={editableEntry?.effective_from ?? ""} required /></label>
            <label>Expires at<input name="expiresAt" type="date" defaultValue={editableEntry?.expires_at ?? ""} /></label>
            <label className="checkbox"><input name="taxIncluded" type="checkbox" defaultChecked={editableEntry?.tax_included ?? true} /> Price includes tax</label>
            <label className="checkbox"><input name="submitForApproval" type="checkbox" defaultChecked={editableEntry?.status === "pending_approval"} /> Submit for approval</label>
            <button className="primary">{editableEntry ? "Save price entry" : "Create price draft"}</button>
          </form> : <p className="empty">You have read-only public-price access.</p>}
        </article>
        {can(data.profile.role, "publishPrices") && <article className="card"><h3>Publish customer price</h3>
          {publishableEntry ? <form key={`publish-${selectedCode}-${publishableEntry.id}-${publishableEntry.status}-${published?.published_at ?? "new"}`} className="form-grid" onSubmit={publish}>
            <p className="muted">Source entry: {publishableEntry.status.replaceAll("_", " ")} · {publishableEntry.effective_from}</p>
            <label>Public sale price (EGP)<input name="salePrice" defaultValue={minorToInput(published?.sale_price_minor ?? publishableEntry.end_user_price_minor)} required /></label>
            <label>Arabic badge<input name="labelAr" defaultValue={published?.discount_label_ar ?? ""} placeholder="خصم لفترة محدودة" /></label>
            <label>English badge<input name="labelEn" defaultValue={published?.discount_label_en ?? ""} placeholder="Limited-time discount" /></label>
            <button className="primary">{publishableEntry.status === "approved" ? "Publish approved price" : "Approve and publish"}</button>
          </form> : <p className="empty">No pending or approved price entry is available for publication.</p>}
        </article>}
        {message && <p role="status" className={message.includes("saved") || message.includes("submitted") || message.includes("published") ? "success" : "error"}>{message}</p>}
      </section>
    </div>
  </div>;
}
