"use client";

import { useState, type FormEvent } from "react";
import { can } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

export function WarehousesPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const { error } = await getSupabase().from("warehouses").insert({ code: String(form.get("code")).toUpperCase(), name_en: String(form.get("nameEn")), name_ar: String(form.get("nameAr")), city_id: String(form.get("cityId")) || null, active: true });
    if (error) setMessage(error.message); else { event.currentTarget.reset(); setMessage("Warehouse added."); await refresh(); }
  }
  return <div className="panel-stack"><header className="page-heading"><div><p className="eyebrow">INVENTORY STRUCTURE</p><h2>Warehouses</h2></div><span className="status-pill">Accounts controlled</span></header>
    <section className="warehouse-grid">{data.warehouses.map((item) => <article className="card" key={item.id}><span className={item.active ? "dot live" : "dot"} /><h3>{item.code}</h3><p>{item.name_en}</p><small>{item.name_ar}</small></article>)}{!data.warehouses.length && <p className="empty">No warehouses configured yet.</p>}</section>
    {can(data.profile.role, "editWarehouses") && <article className="card"><h3>Add warehouse</h3><form className="form-grid" onSubmit={add}><label>Code<input name="code" required /></label><label>English name<input name="nameEn" required /></label><label>Arabic name<input name="nameAr" dir="rtl" required /></label><label>City<select name="cityId"><option value="">Not assigned</option>{data.locations.map((city) => <option key={city.id} value={city.id}>{city.name_en}</option>)}</select></label><button className="primary">Add warehouse</button></form>{message && <p className={message.includes("added") ? "success" : "error"}>{message}</p>}</article>}
  </div>;
}
