"use client";

import { useState } from "react";
import { can } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

export function NotifyRequestsPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  const actionable = can(data.profile.role, "actionStockNotifyRequests");
  const pending = data.notifyRequests.filter((request) => request.status === "pending");
  const resolved = data.notifyRequests.filter((request) => request.status !== "pending");

  async function resolve(id: string, nextStatus: "notified" | "cancelled") {
    const { error } = await getSupabase().from("stock_notify_requests").update({
      status: nextStatus,
      notified_at: nextStatus === "notified" ? new Date().toISOString() : null,
      notified_by: data.profile.user_id,
    }).eq("id", id);
    if (error) setMessage(error.message);
    else { setMessage(nextStatus === "notified" ? "Marked as notified." : "Request cancelled."); await refresh(); }
  }

  return <div className="panel-stack">
    <header className="page-heading">
      <div><p className="eyebrow">DEMAND SIGNAL</p><h2>Notify-me requests</h2></div>
      <span className="status-pill">{pending.length} pending</span>
    </header>
    <article className="card">
      <h3>Pending</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Model</th><th>Customer</th><th>Contact</th><th>Locale</th><th>Requested</th>{actionable && <th>Action</th>}</tr></thead>
          <tbody>
            {pending.map((request) => <tr key={request.id}>
              <td><code>{request.model_code}</code></td>
              <td>{request.customer_name}</td>
              <td>{request.contact}</td>
              <td>{request.locale.toUpperCase()}</td>
              <td>{new Date(request.created_at).toLocaleDateString()}</td>
              {actionable && <td className="button-row">
                <button onClick={() => resolve(request.id, "notified")}>Mark notified</button>
                <button onClick={() => resolve(request.id, "cancelled")}>Cancel</button>
              </td>}
            </tr>)}
          </tbody>
        </table>
      </div>
      {!pending.length && <p className="empty">No pending notify-me requests.</p>}
    </article>
    <article className="card">
      <h3>Resolved history</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Model</th><th>Customer</th><th>Status</th><th>Resolved</th></tr></thead>
          <tbody>
            {resolved.slice(0, 50).map((request) => <tr key={request.id}>
              <td><code>{request.model_code}</code></td>
              <td>{request.customer_name}</td>
              <td><span className={`status ${request.status}`}>{request.status}</span></td>
              <td>{request.notified_at ? new Date(request.notified_at).toLocaleDateString() : "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {!resolved.length && <p className="empty">No resolved requests yet.</p>}
    </article>
    {message && <p className={message.includes("notified") || message.includes("cancelled") ? "success" : "error"} role="status">{message}</p>}
  </div>;
}
