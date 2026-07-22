"use client";

import { useState } from "react";
import { can, canEditSettingDraft } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

type SettingSaveStatus = "draft" | "pending_approval" | "published";

function valueToString(value: unknown): string {
  return typeof value === "string" ? value : typeof value === "boolean" ? String(value) : JSON.stringify(value ?? "");
}

export function SettingsPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(data.settings.map((item) => [item.key, valueToString(item.value_json)])));
  const [message, setMessage] = useState("");

  async function save(settingKey: string, status: SettingSaveStatus) {
    setMessage("");
    const item = data.settings.find((setting) => setting.key === settingKey);
    if (!item) return;
    if (status === "published" ? !can(data.profile.role, "publishSettings") : !canEditSettingDraft(data.profile.role, item.status)) {
      setMessage("This setting is not editable in its current workflow state.");
      return;
    }

    let value: unknown = drafts[settingKey] ?? "";
    if (item.value_type === "boolean") value = value === "true";
    if (item.value_type === "number") value = Number(value);
    if (item.value_type === "json") {
      try {
        value = JSON.parse(String(value));
      } catch {
        setMessage(`Invalid JSON for ${settingKey}`);
        return;
      }
    }

    const publish = status === "published";
    const { error } = await getSupabase()
      .from("site_settings")
      .update({
        value_json: value,
        status,
        published_at: publish ? new Date().toISOString() : null,
        approved_by: publish ? data.profile.user_id : null,
      })
      .eq("key", settingKey)
      .eq("status", item.status)
      .select("key")
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }

    const outcome = status === "pending_approval" ? "submitted for approval" : status === "published" ? "saved and published" : "saved as draft";
    setMessage(`${settingKey} ${outcome}.`);
    await refresh();
  }

  return <div className="panel-stack"><header className="page-heading"><div><p className="eyebrow">PUBLIC CONFIGURATION</p><h2>Contact, social and feature values</h2></div><span className="status-pill">No deployment required after connection</span></header>
    <section className="settings-grid">{data.settings.map((item) => {
      const canDraft = canEditSettingDraft(data.profile.role, item.status);
      const canPublishNow = can(data.profile.role, "publishSettings");
      const canChangeValue = canDraft || canPublishNow;
      return <article className="setting-card" key={item.key}><div><small>{item.category}</small><h3>{item.label_en}</h3><p>{item.label_ar}</p><code>{item.key}</code></div>
        {item.value_type === "boolean" ? <select disabled={!canChangeValue} value={drafts[item.key] ?? "false"} onChange={(event) => setDrafts((current) => ({ ...current, [item.key]: event.target.value }))}><option value="true">Enabled</option><option value="false">Disabled</option></select> : <input disabled={!canChangeValue} dir={item.key.endsWith("_ar") ? "rtl" : "ltr"} value={drafts[item.key] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [item.key]: event.target.value }))} />}
        <div className="button-row">
          {canDraft && <button onClick={() => save(item.key, "draft")}>Save draft</button>}
          {canDraft && <button onClick={() => save(item.key, "pending_approval")}>Submit for approval</button>}
          {canPublishNow && <button className="primary" onClick={() => save(item.key, "published")}>{item.status === "published" ? "Save & publish" : "Publish"}</button>}
        </div>
        {!canChangeValue && <p className="muted">Final settings can only be changed by Management or Super Admin.</p>}
        <span className={`status ${item.status}`}>{item.status.replaceAll("_", " ")}</span>
      </article>;
    })}</section>
    {message && <p role="status" className={message.includes("saved") || message.includes("submitted") ? "success" : "error"}>{message}</p>}
  </div>;
}
