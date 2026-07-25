"use client";

import { useState } from "react";
import { can, type Permission } from "@/lib/access";
import type { ControlPanelSnapshot } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { getSupabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/lib/types";

type StatusAction = {
  label: string;
  next: OrderStatus;
  permission: Permission;
  confirm: string;
};

function actionsFor(order: Order): StatusAction[] {
  switch (order.status) {
    case "pending_payment":
      return [
        {
          label: "Confirm payment received (offline)",
          next: order.requires_inspection ? "inspection_pending" : "inspection_not_required",
          permission: "manageOrderStatus",
          confirm: `Confirm payment for ${order.order_number} was received outside the site (bank transfer, cash, etc.)? Online payment isn't live yet — only use this once payment has actually been verified through another channel.`,
        },
      ];
    case "inspection_pending":
      return [
        { label: "Schedule inspection", next: "inspection_scheduled", permission: "manageInspection", confirm: `Schedule the site inspection for ${order.order_number}?` },
      ];
    case "inspection_scheduled":
      return [
        { label: "Mark inspection passed", next: "inspection_passed", permission: "manageInspection", confirm: `Confirm the site inspection passed for ${order.order_number}?` },
        { label: "Mark inspection failed", next: "inspection_failed_needs_action", permission: "manageInspection", confirm: `Confirm the site inspection failed for ${order.order_number}? This flags the order for reconfiguration or refund.` },
      ];
    case "inspection_failed_needs_action":
      return [
        { label: "Send for customer reconfiguration", next: "reconfigured_awaiting_customer_approval", permission: "manageOrderStatus", confirm: `Move ${order.order_number} to awaiting customer approval for a reconfigured order?` },
        { label: "Request refund", next: "refund_requested", permission: "initiateRefund", confirm: `Record a refund request for ${order.order_number}? This only updates the order status — it does not contact Paymob or move any money. Process the actual refund directly with the payment provider until refund automation exists.` },
      ];
    case "reconfigured_awaiting_customer_approval":
      return [
        { label: "Customer approved (mark adjusted)", next: "paid_adjusted", permission: "manageOrderStatus", confirm: `Confirm the customer approved the reconfigured order for ${order.order_number}?` },
        { label: "Request refund instead", next: "refund_requested", permission: "initiateRefund", confirm: `Record a refund request for ${order.order_number} instead of reconfiguring? This only updates the order status — no money moves automatically.` },
      ];
    case "paid_adjusted":
    case "inspection_passed":
    case "inspection_not_required":
      return [
        { label: "Start fulfillment", next: "fulfillment_processing", permission: "manageOrderStatus", confirm: `Start fulfillment for ${order.order_number}?` },
      ];
    case "fulfillment_processing":
      return [
        { label: "Mark fulfilled", next: "fulfilled", permission: "manageOrderStatus", confirm: `Mark ${order.order_number} as fulfilled?` },
      ];
    case "fulfilled":
      return [
        { label: "Close order", next: "closed", permission: "manageOrderStatus", confirm: `Close ${order.order_number}? This is final.` },
      ];
    case "refund_requested":
      return [
        { label: "Mark fully refunded", next: "refunded", permission: "initiateRefund", confirm: `Confirm the full refund for ${order.order_number} was already completed directly with the payment provider. This only updates the order status. Continue?` },
        { label: "Mark partially refunded", next: "partial_refund", permission: "initiateRefund", confirm: `Confirm a partial refund for ${order.order_number} was already completed directly with the payment provider. This only updates the order status. Continue?` },
      ];
    default:
      return [];
  }
}

const cancellableStatuses: OrderStatus[] = [
  "pending_payment", "paid", "inspection_pending", "inspection_scheduled",
  "inspection_failed_needs_action", "reconfigured_awaiting_customer_approval",
];

const refundStatuses: OrderStatus[] = ["refund_requested", "refunded", "partial_refund"];

export function OrdersPanel({ data, refresh }: { data: ControlPanelSnapshot; refresh: () => Promise<void> }) {
  const [selectedId, setSelectedId] = useState<string | null>(data.orders[0]?.id ?? null);
  const [message, setMessage] = useState("");

  async function setStatus(order: Order, next: OrderStatus, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    const { error } = await getSupabase().from("orders").update({ status: next }).eq("id", order.id);
    if (error) setMessage(error.message);
    else { setMessage(`${order.order_number} moved to ${next.replaceAll("_", " ")}.`); await refresh(); }
  }

  const selectedOrder = data.orders.find((order) => order.id === selectedId) ?? null;
  const items = selectedOrder ? data.orderItems.filter((item) => item.order_id === selectedOrder.id) : [];

  return <div className="panel-stack">
    <header className="page-heading">
      <div><p className="eyebrow">CHECKOUT</p><h2>Orders</h2></div>
      <span className="status-pill">{data.orders.length} orders</span>
    </header>
    <div className="split-layout">
      <article className="list-card">
        <div className="model-list">
          {data.orders.map((order) => <button key={order.id} className={selectedId === order.id ? "active" : ""} onClick={() => setSelectedId(order.id)}>
            <span><b>{order.order_number}</b><small>{order.customer_name}</small></span>
            <em>{formatMoney(order.total_minor, order.currency)}</em>
          </button>)}
          {!data.orders.length && <p className="empty">No orders yet. Orders appear here once the checkout app creates them.</p>}
        </div>
      </article>
      <article className="card editor-stack">
        {!selectedOrder && <p className="empty">Select an order to view its details.</p>}
        {selectedOrder && <>
          <header className="page-heading">
            <div><p className="eyebrow">{selectedOrder.order_number}</p><h3>{selectedOrder.customer_name}</h3></div>
            <span className={`status ${selectedOrder.status}`}>{selectedOrder.status.replaceAll("_", " ")}</span>
          </header>
          <dl className="detail-grid">
            <div><dt>Phone</dt><dd>{selectedOrder.phone}</dd></div>
            <div><dt>Email</dt><dd>{selectedOrder.email ?? "—"}</dd></div>
            <div><dt>Locale</dt><dd>{selectedOrder.locale.toUpperCase()}</dd></div>
            <div><dt>Requires inspection</dt><dd>{selectedOrder.requires_inspection ? "Yes" : "No"}</dd></div>
            <div><dt>Total</dt><dd>{formatMoney(selectedOrder.total_minor, selectedOrder.currency)}</dd></div>
            <div><dt>Placed</dt><dd>{new Date(selectedOrder.created_at).toLocaleString()}</dd></div>
          </dl>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Model</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
              <tbody>{items.map((item) => <tr key={item.id}>
                <td><code>{item.model_code}</code><small>{item.family_name_en}</small></td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.unit_price_minor, selectedOrder.currency)}</td>
                <td>{formatMoney(item.line_total_minor, selectedOrder.currency)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="button-row">
            {actionsFor(selectedOrder).filter((action) => can(data.profile.role, action.permission)).map((action) => (
              <button key={action.next} onClick={() => setStatus(selectedOrder, action.next, action.confirm)}>{action.label}</button>
            ))}
            {cancellableStatuses.includes(selectedOrder.status) && can(data.profile.role, "manageOrderStatus") && (
              <button onClick={() => setStatus(selectedOrder, "cancelled_refunded", `Cancel ${selectedOrder.order_number}? This does not process any refund automatically.`)}>Cancel order</button>
            )}
          </div>
          {refundStatuses.includes(selectedOrder.status) && (
            <p className="muted">Refund status here is administrative record-keeping only — actual funds movement must be completed directly with Paymob (or the relevant BNPL provider) until refund automation exists.</p>
          )}
        </>}
      </article>
    </div>
    {message && <p className={message.includes("moved") ? "success" : "error"} role="status">{message}</p>}
  </div>;
}
