"use client";

import { useState, type FormEvent } from "react";
import { can } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";
import { formatMoney, inputToMinor } from "@/lib/money";

export function DiscountsPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setMessage("");
    const publish = can(data.profile.role, "publishDiscounts") && form.get("publish") === "on";
    const status = publish ? "published" : form.get("submitForApproval") === "on" ? "pending_approval" : "draft";
    const discountType = String(form.get("type"));
    const rawValue = String(form.get("value"));
    const discountValue = discountType === "percentage" ? Math.round(Number(rawValue) * 100) : inputToMinor(rawValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "percentage" && discountValue > 10000)) { setMessage("Enter a valid discount value."); return; }
    if (publish && !window.confirm("Approve and publish this discount campaign immediately? It will become publicly eligible now.")) return;
    const { error } = await getSupabase().from("discount_campaigns").insert({
      code: String(form.get("code")).trim().toUpperCase(), title_ar: String(form.get("titleAr")), title_en: String(form.get("titleEn")),
      discount_type: discountType, discount_value_minor_or_bps: discountValue, starts_at: String(form.get("startsAt")), ends_at: String(form.get("endsAt")),
      approval_reference: String(form.get("approval")) || null, status, approved_by: publish ? data.profile.user_id : null,
    });
    if (error) setMessage(error.message); else { setMessage(status === "draft" ? "Campaign draft saved." : status === "pending_approval" ? "Campaign submitted for approval." : "Campaign published."); event.currentTarget.reset(); await refresh(); }
  }
  return <div className="panel-stack"><header className="page-heading"><div><p className="eyebrow">CAMPAIGNS</p><h2>Discount management</h2></div></header>
    <div className="dashboard-grid"><article className="card"><h3>Campaigns</h3><div className="table-wrap"><table><thead><tr><th>Code</th><th>Campaign</th><th>Value</th><th>Period</th><th>Status</th></tr></thead><tbody>{data.discounts.map((item) => <tr key={item.id}><td>{item.code}</td><td>{item.title_en}<small>{item.title_ar}</small></td><td>{item.discount_type === "percentage" ? `${(item.discount_value_minor_or_bps / 100).toFixed(2).replace(/\.00$/, "")}%` : formatMoney(item.discount_value_minor_or_bps)}</td><td>{item.starts_at}<small>to {item.ends_at}</small></td><td><span className={`status ${item.status}`}>{item.status.replaceAll("_", " ")}</span></td></tr>)}</tbody></table></div></article>
      {can(data.profile.role, "editDiscounts") && <article className="card"><h3>Create campaign</h3><form className="form-grid one" onSubmit={create}>
        <label>Campaign code<input name="code" required /></label><label>English title<input name="titleEn" required /></label><label>Arabic title<input name="titleAr" dir="rtl" required /></label>
        <label>Discount type<select name="type"><option value="percentage">Percentage</option><option value="fixed_amount">Fixed amount</option></select></label><label>Discount value<input name="value" type="number" min="0" step="0.01" required /></label>
        <label>Starts at<input name="startsAt" type="datetime-local" required /></label><label>Ends at<input name="endsAt" type="datetime-local" required /></label><label>Miraco/internal approval reference<input name="approval" /></label>
        <label className="checkbox"><input type="checkbox" name="submitForApproval" /> Submit for approval</label>
        {can(data.profile.role, "publishDiscounts") && <label className="checkbox"><input type="checkbox" name="publish" /> Approve and publish immediately</label>}<button className="primary">Save campaign</button>
      </form>{message && <p role="status" className={message.includes("saved") || message.includes("submitted") || message.includes("published") ? "success" : "error"}>{message}</p>}</article>}
    </div></div>;
}
