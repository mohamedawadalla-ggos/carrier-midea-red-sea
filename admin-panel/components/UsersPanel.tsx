"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";
import type { AppRole, ManagedStaffUser } from "@/lib/types";

const roles: AppRole[] = ["super_admin", "management", "accounts", "sales", "operations", "marketing", "auditor"];
type StaffResponse = { users?: ManagedStaffUser[]; error?: string; resent?: boolean };

export function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<ManagedStaffUser[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const invoke = useCallback(async (body: Record<string, unknown>): Promise<StaffResponse> => {
    const { data, error } = await getSupabase().functions.invoke<StaffResponse>("manage-staff-users", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data ?? {};
  }, []);

  const reload = useCallback(async () => {
    const result = await invoke({ action: "list" });
    setUsers(result.users ?? []);
  }, [invoke]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load staff users."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    try {
      const result = await invoke({ action: "invite", email: String(form.get("email")), full_name: String(form.get("fullName")), role: String(form.get("role")) });
      formElement.reset();
      await reload();
      setMessage(result.resent ? "This email was already invited — the invitation email was resent." : "Invitation sent and staff access created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to invite user.");
    } finally {
      setBusy(false);
    }
  }

  async function save(user: ManagedStaffUser, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await invoke({ action: "update", user_id: user.user_id, email: String(form.get("email")), full_name: String(form.get("fullName")), role: String(form.get("role")), active: form.get("active") === "on" });
      await reload();
      setMessage("Staff user updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update user.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel-stack">
    <header className="page-heading"><div><p className="eyebrow">ACCESS CONTROL</p><h2>Staff users</h2></div><span className="status-pill">Super-admin only</span></header>
    <article className="card"><h3>Invite staff member</h3><p className="muted">The user receives an invitation email. Their role is enforced by database policies, not only this screen.</p>
      <form className="form-grid staff-invite-form" onSubmit={invite}>
        <label>Email<input name="email" type="email" autoComplete="off" required /></label>
        <label>Full name<input name="fullName" minLength={2} maxLength={120} required /></label>
        <label>Role<select name="role" defaultValue="sales">{roles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></label>
        <button className="primary" disabled={busy}>Send invitation</button>
      </form>
    </article>
    <article className="card"><h3>Current staff</h3><div className="staff-user-list">
      {users.map((user) => <form className={`staff-user-card ${user.active ? "" : "inactive"}`} key={user.user_id} onSubmit={(event) => save(user, event)}>
        <div className="staff-user-heading"><div><strong>{user.full_name}</strong><small>{user.user_id === currentUserId ? "Your account" : user.last_sign_in_at ? `Last sign-in ${new Date(user.last_sign_in_at).toLocaleString()}` : "Never signed in"}</small></div><span className={`status ${user.active ? "published" : "archived"}`}>{user.active ? "Active" : "Deactivated"}</span></div>
        <label>Email<input name="email" type="email" defaultValue={user.email} required /></label>
        <label>Full name<input name="fullName" defaultValue={user.full_name} minLength={2} maxLength={120} required /></label>
        <label>Role<select name="role" defaultValue={user.role}>{roles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></label>
        <label className="checkbox"><input name="active" type="checkbox" defaultChecked={user.active} /> Active staff access</label>
        <button className={user.active ? "draft-action" : "primary"} disabled={busy}>Save changes</button>
        <small className="muted">Deactivation bans new Auth sessions and immediately removes database privileges through the active-profile check. Existing access tokens expire at the configured JWT lifetime.</small>
      </form>)}
    </div>{!users.length && <p className="empty">No staff users returned.</p>}</article>
    {message && <p className={message.includes("sent") || message.includes("updated") ? "success" : "error"} role="status">{message}</p>}
  </section>;
}
