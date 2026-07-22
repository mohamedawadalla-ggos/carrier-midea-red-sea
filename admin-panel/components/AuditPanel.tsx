import type { ControlPanelSnapshot } from "@/lib/data";

export function AuditPanel({ data }: { data: ControlPanelSnapshot }) {
  return <div className="panel-stack"><header className="page-heading"><div><p className="eyebrow">ACCOUNTABILITY</p><h2>Audit history</h2></div><span className="status-pill">Latest 100 events</span></header>
    <article className="card"><div className="table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Table</th><th>Record</th><th>User</th></tr></thead><tbody>{data.audit.map((item) => <tr key={item.id}><td>{new Date(item.created_at).toLocaleString()}</td><td><span className="status published">{item.action}</span></td><td>{item.table_name}</td><td>{item.row_id ?? "—"}</td><td>{item.actor_user_id ?? "System"}</td></tr>)}</tbody></table></div>{!data.audit.length && <p className="empty">No accessible audit events.</p>}</article>
  </div>;
}
