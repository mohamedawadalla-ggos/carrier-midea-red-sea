"use client";

import { useState, type FormEvent } from "react";
import { can } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import type { ServiceLocation } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

const flags = ["active", "sales_available", "delivery_available", "installation_available", "maintenance_available", "mobilization_required", "requires_inspection"] as const;

export function LocationsPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  async function toggle(city: ServiceLocation, key: typeof flags[number]) {
    const publish = data.profile.role === "super_admin" || data.profile.role === "management";
    const values = Object.fromEntries(flags.map((flag) => [flag, flag === key ? !city[flag] : city[flag]]));
    const query = publish
      ? getSupabase().from("service_locations").update({ [key]: !city[key], status: "published", approved_by: data.profile.user_id }).eq("id", city.id)
      : getSupabase().from("service_location_revisions").insert({ location_id: city.id, ...values, status: "pending_approval", created_by: data.profile.user_id });
    const { error } = await query;
    if (error) setMessage(error.message); else { setMessage(publish ? "Location published." : "Change submitted; the published location remains live."); await refresh(); }
  }
  async function publishRevision(id: string) {
    const { error } = await getSupabase().rpc("publish_service_location_revision", { revision_id: id });
    if (error) setMessage(error.message); else { setMessage("Location revision published."); await refresh(); }
  }
  async function addCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const { error } = await getSupabase().from("service_locations").insert({ slug: String(form.get("slug")), name_ar: String(form.get("nameAr")), name_en: String(form.get("nameEn")), governorate_ar: String(form.get("govAr")), governorate_en: String(form.get("govEn")), display_order: data.locations.length + 1, status: data.profile.role === "super_admin" || data.profile.role === "management" ? "published" : "pending_approval", approved_by: data.profile.role === "super_admin" || data.profile.role === "management" ? data.profile.user_id : null });
    if (error) setMessage(error.message); else { event.currentTarget.reset(); setMessage("City added for approval."); await refresh(); }
  }
  return <div className="panel-stack"><header className="page-heading"><div><p className="eyebrow">SERVICE MAP</p><h2>Cities and service capabilities</h2></div></header>
    <article className="card"><div className="table-wrap"><table><thead><tr><th>City</th>{flags.map((flag) => <th key={flag}>{flag.replaceAll("_", " ")}</th>)}<th>Status</th></tr></thead><tbody>{data.locations.map((city) => { const pending = data.locationRevisions.find((item) => item.location_id === city.id && item.status === "pending_approval"); return <tr key={city.id}><td><b>{city.name_en}</b><small>{city.name_ar}</small></td>{flags.map((flag) => <td key={flag}><button className={`toggle ${city[flag] ? "on" : ""}`} disabled={!can(data.profile.role, "editLocations") || Boolean(pending)} onClick={() => toggle(city, flag)} aria-label={`Toggle ${flag} for ${city.name_en}`}><span /></button></td>)}<td><span className={`status ${pending ? "pending_approval" : city.status}`}>{pending ? "pending approval" : city.status.replaceAll("_", " ")}</span>{pending && (data.profile.role === "management" || data.profile.role === "super_admin") && <button className="primary" onClick={() => publishRevision(pending.id)}>Approve</button>}</td></tr>; })}</tbody></table></div></article>
    {can(data.profile.role, "editLocations") && <article className="card"><h3>Add service city</h3><form className="form-grid" onSubmit={addCity}><label>Slug<input name="slug" pattern="[a-z0-9-]+" required /></label><label>English name<input name="nameEn" required /></label><label>Arabic name<input name="nameAr" dir="rtl" required /></label><label>Governorate (English)<input name="govEn" defaultValue="Red Sea" required /></label><label>Governorate (Arabic)<input name="govAr" dir="rtl" defaultValue="البحر الأحمر" required /></label><button className="primary">Add for approval</button></form></article>}
    {message && <p className={message.includes("added") ? "success" : "error"}>{message}</p>}
  </div>;
}
