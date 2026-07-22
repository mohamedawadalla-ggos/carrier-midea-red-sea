"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { loadSnapshot, type ControlPanelSnapshot } from "@/lib/data";
import { LoginScreen } from "@/components/LoginScreen";
import { OverviewPanel } from "@/components/OverviewPanel";
import { PricesPanel } from "@/components/PricesPanel";
import { DiscountsPanel } from "@/components/DiscountsPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { LocationsPanel } from "@/components/LocationsPanel";
import { WarehousesPanel } from "@/components/WarehousesPanel";
import { AuditPanel } from "@/components/AuditPanel";

const tabs = ["overview", "prices", "discounts", "settings", "locations", "warehouses", "audit"] as const;
type Tab = typeof tabs[number];

export function ControlPanelApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<ControlPanelSnapshot | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadForSession = useCallback(async (current: Session | null) => {
    setSession(current);
    if (!current) {
      setData(null);
      setError("");
      setLoading(false);
      return;
    }

    try {
      const snapshot = await loadSnapshot(current.user.id);
      if (!snapshot.profile.active) throw new Error("This staff account is disabled.");
      setData(snapshot);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load the control panel.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const current = (await getSupabase().auth.getSession()).data.session;
    await loadForSession(current);
  }, [loadForSession]);

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;

    void supabase.auth.getSession().then(({ data: authData }) => {
      if (active) void loadForSession(authData.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      queueMicrotask(() => {
        if (active) void loadForSession(nextSession);
      });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadForSession]);

  if (loading) return <main className="center-state"><div className="spinner" /><p>Loading protected workspace…</p></main>;
  if (!session) return <LoginScreen onSignedIn={refresh} />;
  if (!data) return <main className="center-state"><h1>Access unavailable</h1><p>{error}</p><button onClick={() => getSupabase().auth.signOut()}>Sign out</button></main>;

  const settingsVersion = data.settings.map((item) => `${item.key}:${item.updated_at}`).join("|");
  const panels: Record<Tab, React.ReactNode> = {
    overview: <OverviewPanel data={data} />,
    prices: <PricesPanel data={data} refresh={refresh} />,
    discounts: <DiscountsPanel data={data} refresh={refresh} />,
    settings: <SettingsPanel key={settingsVersion} data={data} refresh={refresh} />,
    locations: <LocationsPanel data={data} refresh={refresh} />,
    warehouses: <WarehousesPanel data={data} refresh={refresh} />,
    audit: <AuditPanel data={data} />,
  };

  return <div className="admin-shell"><aside className="sidebar"><div className="logo"><span>CM</span><div><strong>Carrier–Midea</strong><small>RED SEA CONTROL</small></div></div><nav>{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}><span>{({ overview: "◫", prices: "£", discounts: "%", settings: "⚙", locations: "⌖", warehouses: "▦", audit: "◎" } as const)[item]}</span>{item}</button>)}</nav><footer><div><b>{data.profile.full_name}</b><small>{data.profile.role.replaceAll("_", " ")}</small></div><button onClick={() => getSupabase().auth.signOut()}>Sign out</button></footer></aside><main className="workspace"><div className="mobile-top"><strong>CM Red Sea Control</strong><select value={tab} onChange={(event) => setTab(event.target.value as Tab)}>{tabs.map((item) => <option key={item}>{item}</option>)}</select></div>{panels[tab]}</main></div>;
}
