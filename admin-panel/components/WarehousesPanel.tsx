"use client";

import { useState, type FormEvent } from "react";
import { can } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import type { Warehouse } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

type WarehouseFields = Pick<Warehouse, "code" | "name_en" | "name_ar" | "city_id" | "active">;

function fields(form: FormData): WarehouseFields {
  return {
    code: String(form.get("code")).trim().toUpperCase(),
    name_en: String(form.get("nameEn")).trim(),
    name_ar: String(form.get("nameAr")).trim(),
    city_id: String(form.get("cityId")) || null,
    active: form.get("active") === "on",
  };
}

export function WarehousesPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const editable = can(data.profile.role, "editWarehouses");

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = fields(new FormData(event.currentTarget));
    const { error } = await getSupabase().from("warehouses").insert(payload);
    if (error) setMessage(error.message);
    else { event.currentTarget.reset(); setMessage("Warehouse added."); await refresh(); }
  }

  async function update(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const { error } = await getSupabase().from("warehouses").update(fields(new FormData(event.currentTarget))).eq("id", id);
    if (error) setMessage(error.message);
    else { setEditingId(null); setMessage("Warehouse updated."); await refresh(); }
  }

  const cityOptions = <><option value="">Not assigned</option>{data.locations.map((city) => <option key={city.id} value={city.id}>{city.name_en}</option>)}</>;

  return <div className="panel-stack">
    <header className="page-heading"><div><p className="eyebrow">INVENTORY STRUCTURE</p><h2>Warehouses</h2></div><span className="status-pill">Role controlled</span></header>
    <section className="warehouse-grid">{data.warehouses.map((item) => <article className="card" key={item.id}>
      {editingId === item.id ? <form className="form-grid" onSubmit={(event) => update(event, item.id)}>
        <label>Code<input name="code" defaultValue={item.code} required /></label>
        <label>English name<input name="nameEn" defaultValue={item.name_en} required /></label>
        <label>Arabic name<input name="nameAr" defaultValue={item.name_ar} dir="rtl" required /></label>
        <label>City<select name="cityId" defaultValue={item.city_id ?? ""}>{cityOptions}</select></label>
        <label className="check-row"><input type="checkbox" name="active" defaultChecked={item.active} /> Active warehouse</label>
        <div className="inline-actions"><button className="primary">Save changes</button><button type="button" onClick={() => setEditingId(null)}>Cancel</button></div>
      </form> : <>
        <span className={item.active ? "dot live" : "dot"} /><h3>{item.code}</h3><p>{item.name_en}</p><small>{item.name_ar}</small>
        {editable && <button type="button" className="secondary" onClick={() => setEditingId(item.id)}>Edit warehouse</button>}
      </>}
    </article>)}{!data.warehouses.length && <p className="empty">No warehouses configured yet.</p>}</section>
    {editable && <article className="card"><h3>Add warehouse</h3><form className="form-grid" onSubmit={add}>
      <label>Code<input name="code" required /></label><label>English name<input name="nameEn" required /></label><label>Arabic name<input name="nameAr" dir="rtl" required /></label><label>City<select name="cityId">{cityOptions}</select></label><label className="check-row"><input type="checkbox" name="active" defaultChecked /> Active warehouse</label><button className="primary">Add warehouse</button>
    </form></article>}
    {message && <p className={message.includes(".") ? "success" : "error"}>{message}</p>}
  </div>;
}
