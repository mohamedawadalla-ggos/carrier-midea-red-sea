"use client";

import { useState } from "react";
import { can } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

export function StockStatusPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const editable = can(data.profile.role, "editStockStatus");
  const catalogEditable = can(data.profile.role, "editCatalogProducts");
  const statusByModel = new Map(data.stockStatuses.map((row) => [row.model_code, row]));

  async function toggleInspection(modelCode: string, nextValue: boolean) {
    const { error } = await getSupabase().from("catalog_products").update({ requires_inspection: nextValue }).eq("model_code", modelCode);
    if (error) setMessage(error.message);
    else { setMessage(`${modelCode} inspection requirement set to ${nextValue ? "required" : "not required"}.`); await refresh(); }
  }

  async function saveQuantity(modelCode: string, currentQuantity: number) {
    const draft = drafts[modelCode];
    const nextQuantity = draft === undefined ? currentQuantity : Number(draft);
    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      setMessage(`Enter a whole number of 0 or more for ${modelCode}.`);
      return;
    }
    const { error } = await getSupabase().from("product_stock_status").upsert({
      model_code: modelCode,
      quantity_on_hand: nextQuantity,
      updated_by: data.profile.user_id,
    });
    if (error) setMessage(error.message);
    else {
      setMessage(`${modelCode} set to ${nextQuantity} units.`);
      setDrafts((current) => { const next = { ...current }; delete next[modelCode]; return next; });
      await refresh();
    }
  }

  return <div className="panel-stack">
    <header className="page-heading">
      <div><p className="eyebrow">AVAILABILITY</p><h2>Stock quantities</h2></div>
      <span className="status-pill">{editable ? "Operations controlled" : "Read-only for your role"}</span>
    </header>
    <article className="card">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Model</th><th>Family</th><th>Quantity on hand</th><th>Status</th><th>Needs inspection</th>{editable && <th>Action</th>}</tr></thead>
          <tbody>
            {data.products.map((product) => {
              const row = statusByModel.get(product.model_code);
              const quantity = row?.quantity_on_hand ?? 0;
              const status = row?.status ?? "out_of_stock";
              const draftValue = drafts[product.model_code] ?? String(quantity);
              return <tr key={product.model_code}>
                <td><code>{product.model_code}</code></td>
                <td>{product.family_name_en}<small>{product.family_name_ar}</small></td>
                <td>
                  {editable
                    ? <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={draftValue}
                        onChange={(event) => setDrafts((current) => ({ ...current, [product.model_code]: event.target.value }))}
                      />
                    : quantity}
                </td>
                <td><span className={`status ${status}`}>{status.replaceAll("_", " ")}</span></td>
                <td>
                  {catalogEditable
                    ? <button className={`toggle ${product.requires_inspection ? "on" : ""}`} onClick={() => toggleInspection(product.model_code, !product.requires_inspection)} aria-label={`Toggle inspection requirement for ${product.model_code}`}>
                        <span />
                      </button>
                    : (product.requires_inspection ? "Yes" : "No")}
                </td>
                {editable && <td className="button-row">
                  <button onClick={() => saveQuantity(product.model_code, quantity)}>Save</button>
                </td>}
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {!data.products.length && <p className="empty">No catalog models loaded.</p>}
    </article>
    {message && <p className={message.includes("set to") ? "success" : "error"} role="status">{message}</p>}
  </div>;
}
