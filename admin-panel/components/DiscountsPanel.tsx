"use client";

import { useMemo, useState, type FormEvent } from "react";
import { can } from "@/lib/access";
import { calculateDiscountBps, parseCeilingPricePaste, validateCeilingPrice } from "@/lib/discount-ceiling";
import type { ControlPanelSnapshot } from "@/lib/data";
import { formatMoney, inputToMinor, minorToInput } from "@/lib/money";
import { getSupabase } from "@/lib/supabase";
import type { DiscountCampaign } from "@/lib/types";

type CampaignType = DiscountCampaign["discount_type"];

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toInputValue(item: DiscountCampaign): string {
  return item.discount_value_minor_or_bps === null
    ? ""
    : String(item.discount_value_minor_or_bps / 100);
}

export function DiscountsPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<DiscountCampaign | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignType>("percentage");
  const [ceilingPrices, setCeilingPrices] = useState<Record<string, string>>({});
  const [pasteValue, setPasteValue] = useState("");
  const activeCampaign = data.discounts.find((item) => item.status === "published");
  const canEditCampaign = (item: DiscountCampaign) =>
    can(data.profile.role, "editDiscounts")
    && (item.status === "draft" || item.status === "pending_approval")
    && (data.profile.role !== "marketing" || item.created_by === data.profile.user_id);
  const canPublish = can(data.profile.role, "publishDiscounts")
    && (campaignType !== "ceiling_price" || data.profile.role === "super_admin");

  const ceilingRows = useMemo(() => data.products.filter((product) => product.active).map((product) => {
    const published = data.publishedPrices.find((price) => price.model_code === product.model_code && price.published);
    const floor = data.priceEntries.find((entry) =>
      entry.model_code === product.model_code
      && published
      && entry.end_user_price_minor === published.list_price_minor
      && entry.effective_from === published.effective_from
      && entry.status === "published"
      && entry.minimum_price_minor !== null
    )?.minimum_price_minor ?? null;
    const raw = ceilingPrices[product.model_code] ?? "";
    let salePriceMinor: number | null = null;
    try { salePriceMinor = raw ? inputToMinor(raw) : null; } catch { salePriceMinor = null; }
    const error = published && salePriceMinor !== null
      ? validateCeilingPrice({ modelCode: product.model_code, listPriceMinor: published.list_price_minor, minimumPriceMinor: floor, salePriceMinor })
      : null;
    return { product, published, floor, raw, salePriceMinor, error };
  }), [ceilingPrices, data.priceEntries, data.products, data.publishedPrices]);

  function beginEdit(item: DiscountCampaign) {
    const prices = Object.fromEntries(data.discountProducts
      .filter((link) => link.campaign_id === item.id && link.campaign_sale_price_minor !== null)
      .map((link) => [link.model_code, minorToInput(link.campaign_sale_price_minor)]));
    setEditing(item);
    setCampaignType(item.discount_type);
    setCeilingPrices(prices);
    setPasteValue("");
    setMessage("");
  }

  function resetEditor() {
    setEditing(null);
    setCampaignType("percentage");
    setCeilingPrices({});
    setPasteValue("");
  }

  function applyPaste() {
    try {
      const parsed = parseCeilingPricePaste(pasteValue);
      const known = new Set(data.products.filter((product) => product.active).map((product) => product.model_code));
      const unknown = parsed.find((item) => !known.has(item.modelCode));
      if (unknown) throw new Error(`Unknown or inactive model: ${unknown.modelCode}.`);
      setCeilingPrices((current) => ({
        ...current,
        ...Object.fromEntries(parsed.map((item) => [item.modelCode, minorToInput(item.salePriceMinor)])),
      }));
      setMessage(`${parsed.length} ceiling prices loaded into the review table.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to read pasted prices.");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const publish = canPublish && form.get("publish") === "on";
    const status = editing?.status ?? (form.get("submitForApproval") === "on" ? "pending_approval" : "draft");
    const rawValue = String(form.get("value") ?? "");
    let discountValue: number | null = null;
    try {
      if (campaignType === "ceiling_price") {
        if (data.profile.role !== "super_admin") throw new Error("Only a super admin can manage ceiling-price campaigns.");
      } else {
        discountValue = campaignType === "percentage" ? Math.round(Number(rawValue) * 100) : inputToMinor(rawValue);
        if (!Number.isFinite(discountValue) || discountValue <= 0 || (campaignType === "percentage" && discountValue > 10000)) {
          throw new Error("Enter a valid discount value.");
        }
      }
      const startsAt = new Date(String(form.get("startsAt")));
      const endsAt = new Date(String(form.get("endsAt")));
      if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
        throw new Error("The campaign end time must be after its start time.");
      }
      if (editing && !canEditCampaign(editing)) throw new Error("This campaign is no longer editable.");

      const ceilingItems = ceilingRows.filter((row) => row.raw).map((row) => {
        if (!row.published || row.salePriceMinor === null) throw new Error(`${row.product.model_code}: enter a valid offer price.`);
        const error = validateCeilingPrice({
          modelCode: row.product.model_code,
          listPriceMinor: row.published.list_price_minor,
          minimumPriceMinor: row.floor,
          salePriceMinor: row.salePriceMinor,
        });
        if (error) throw new Error(error);
        return { model_code: row.product.model_code, sale_price_minor: row.salePriceMinor };
      });
      if (campaignType === "ceiling_price" && ceilingItems.length === 0) throw new Error("Enter at least one ceiling price.");

      if (publish) {
        const replacement = activeCampaign && activeCampaign.id !== editing?.id
          ? ` This will archive ${activeCampaign.code} and replace it immediately.`
          : "";
        if (!window.confirm(`Publish this campaign now?${replacement} Only one campaign can remain active.`)) return;
      }

      const values = {
        code: String(form.get("code")).trim().toUpperCase(),
        title_ar: String(form.get("titleAr")),
        title_en: String(form.get("titleEn")),
        discount_type: campaignType,
        discount_value_minor_or_bps: discountValue,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        approval_reference: String(form.get("approval")) || null,
        status,
        approved_by: null,
      };
      const supabase = getSupabase();
      const result = editing
        ? await supabase.from("discount_campaigns").update(values).eq("id", editing.id).select("id").single()
        : await supabase.from("discount_campaigns").insert(values).select("id").single();
      if (result.error) throw result.error;
      const campaignId = result.data.id as string;

      if (campaignType === "ceiling_price") {
        const { error } = await supabase.rpc("save_ceiling_campaign_products", { p_campaign_id: campaignId, p_items: ceilingItems });
        if (error) throw error;
      } else if (!editing) {
        const { error } = await supabase.from("discount_campaign_products").insert(
          data.products.filter((product) => product.active).map((product) => ({ campaign_id: campaignId, model_code: product.model_code })),
        );
        if (error) throw error;
      }
      if (publish) {
        const { error } = await supabase.rpc("publish_discount_campaign", { p_campaign_id: campaignId });
        if (error) throw error;
      }

      setMessage(publish ? "Campaign published; any previous campaign was archived." : status === "pending_approval" ? "Campaign submitted for approval." : "Campaign draft saved.");
      resetEditor();
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save campaign.");
    }
  }

  async function archive(item: DiscountCampaign) {
    if (!window.confirm(`Archive ${item.code}? Its discount will stop immediately.`)) return;
    const { error } = await getSupabase().from("discount_campaigns").update({ status: "archived" }).eq("id", item.id).eq("status", "published");
    setMessage(error ? error.message : "Campaign archived.");
    if (!error) await refresh();
  }

  const enteredRows = ceilingRows.filter((row) => row.raw);
  const validRows = enteredRows.filter((row) => row.salePriceMinor !== null && !row.error && row.published);
  const maxDiscountBps = validRows.reduce((maximum, row) => Math.max(maximum, calculateDiscountBps(row.published!.list_price_minor, row.salePriceMinor!)), 0);

  return <div className="panel-stack"><header className="page-heading"><div><p className="eyebrow">CAMPAIGNS</p><h2>Discount management</h2></div><span className="status-pill">One live campaign maximum</span></header>
    <div className="dashboard-grid"><article className="card"><h3>Campaigns</h3><div className="table-wrap"><table><thead><tr><th>Code</th><th>Campaign</th><th>Method</th><th>Value</th><th>Period</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.discounts.map((item) => <tr key={item.id}><td>{item.code}</td><td>{item.title_en}<small>{item.title_ar}</small></td><td>{item.discount_type === "ceiling_price" ? "Ceiling prices" : item.discount_type.replaceAll("_", " ")}</td><td>{item.discount_type === "percentage" && item.discount_value_minor_or_bps !== null ? `${(item.discount_value_minor_or_bps / 100).toFixed(2).replace(/\.00$/, "")}%` : item.discount_type === "fixed_amount" ? formatMoney(item.discount_value_minor_or_bps) : `${data.discountProducts.filter((link) => link.campaign_id === item.id).length} models`}</td><td>{item.starts_at}<small>to {item.ends_at}</small></td><td><span className={`status ${item.status}`}>{item.status.replaceAll("_", " ")}</span></td><td><div className="table-actions">{canEditCampaign(item) && <button className="table-action" type="button" onClick={() => beginEdit(item)}>Edit</button>}{item.status === "published" && can(data.profile.role, "publishDiscounts") && <button className="table-action danger" type="button" onClick={() => void archive(item)}>Archive</button>}</div></td></tr>)}</tbody></table></div></article>
      {can(data.profile.role, "editDiscounts") && <article className="card campaign-editor"><h3>{editing ? `Edit ${editing.code}` : "Create campaign"}</h3><form key={editing?.id ?? "create"} className="form-grid one" onSubmit={save}>
        <label>Campaign code<input name="code" defaultValue={editing?.code} required /></label><label>English title<input name="titleEn" defaultValue={editing?.title_en} required /></label><label>Arabic title<input name="titleAr" dir="rtl" defaultValue={editing?.title_ar} required /></label>
        <label>Discount method<select name="type" value={campaignType} onChange={(event) => setCampaignType(event.target.value as CampaignType)} disabled={Boolean(editing)}><option value="percentage">Percentage</option><option value="fixed_amount">Fixed amount</option>{data.profile.role === "super_admin" && <option value="ceiling_price">Ceiling prices (Super Admin)</option>}</select></label>
        {campaignType !== "ceiling_price" && <label>Discount value<input name="value" type="number" min="0" step="0.01" defaultValue={editing ? toInputValue(editing) : undefined} required /></label>}
        <label>Starts at<input name="startsAt" type="datetime-local" defaultValue={editing ? toDateTimeLocal(editing.starts_at) : undefined} required /></label><label>Ends at<input name="endsAt" type="datetime-local" defaultValue={editing ? toDateTimeLocal(editing.ends_at) : undefined} required /></label><label>Miraco/internal approval reference<input name="approval" defaultValue={editing?.approval_reference ?? ""} /></label>
        {campaignType === "ceiling_price" && <section className="ceiling-price-editor"><div className="price-section-heading"><div><p className="section-kicker">SUPER ADMIN PRICE CEILING</p><h3>Model offer prices</h3><p className="muted">Customer price is read-only. Paste two Excel columns: model code, then offer price.</p></div><div className="ceiling-summary"><strong>{enteredRows.length} models</strong><small>Maximum calculated discount {(maxDiscountBps / 100).toFixed(2)}%</small></div></div>
          <div className="paste-prices"><textarea aria-label="Paste model codes and offer prices" value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} placeholder={'53KHCT12N-708\t25000\nM1SEFT-12CRN8F-Q8\t22000'} /><button type="button" onClick={applyPaste}>Load pasted prices</button></div>
          <div className="table-wrap ceiling-table"><table><thead><tr><th>Model</th><th>Customer price</th><th>Offer price</th><th>Calculated discount</th><th>Validation</th></tr></thead><tbody>{ceilingRows.map((row) => <tr key={row.product.model_code} className={row.error ? "invalid-price-row" : ""}><td>{row.product.model_code}<small>{row.product.family_name_en}</small></td><td>{formatMoney(row.published?.list_price_minor)}</td><td><input aria-label={`Offer price for ${row.product.model_code}`} inputMode="decimal" value={row.raw} onChange={(event) => setCeilingPrices((current) => ({ ...current, [row.product.model_code]: event.target.value }))} /></td><td>{row.published && row.salePriceMinor !== null ? `${(calculateDiscountBps(row.published.list_price_minor, row.salePriceMinor) / 100).toFixed(2)}%` : "—"}</td><td>{row.error ? <span className="negative">{row.error}</span> : row.raw ? <span className="success-text">Ready</span> : <span className="muted">Not included</span>}</td></tr>)}</tbody></table></div>
        </section>}
        {!editing && <label className="checkbox"><input type="checkbox" name="submitForApproval" /> Submit for approval</label>}
        {canPublish && <label className="checkbox"><input type="checkbox" name="publish" /> Publish now and archive any current campaign</label>}
        <button className="primary">{editing ? "Save changes" : "Save campaign"}</button>
        {editing && <button type="button" onClick={resetEditor}>Cancel editing</button>}
      </form>{message && <p role="status" className={message.includes("saved") || message.includes("submitted") || message.includes("published") || message.includes("loaded") || message.includes("archived") ? "success" : "error"}>{message}</p>}</article>}
    </div></div>;
}
