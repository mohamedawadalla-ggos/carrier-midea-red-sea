"use client";

import { useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";

function passwordIssue(password: string): string | null {
  if (password.length < 14) return "Use at least 14 characters.";
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/\d/.test(password)) return "Add at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Add at least one symbol.";
  return null;
}

export function AccountPanel({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const currentPassword = String(values.get("currentPassword"));
    const newPassword = String(values.get("newPassword"));
    const confirmPassword = String(values.get("confirmPassword"));
    setMessage("");
    setSuccess(false);

    const issue = passwordIssue(newPassword);
    if (issue) { setMessage(issue); return; }
    if (newPassword !== confirmPassword) { setMessage("New passwords do not match."); return; }
    if (newPassword === currentPassword) { setMessage("Choose a password different from the current password."); return; }

    setBusy(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      });
      if (error) throw error;
      const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
      if (signOutError) throw signOutError;
      form.reset();
      setSuccess(true);
      setMessage("Password changed. Other signed-in sessions were ended.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="panel-stack">
    <header className="page-heading"><div><p className="eyebrow">ACCOUNT SECURITY</p><h2>Your account</h2></div><span className="status-pill">Signed in as {email}</span></header>
    <section className="account-grid">
      <article className="card"><h3>Change password</h3><p className="muted">Confirm your current password, then use at least 14 characters with uppercase, lowercase, a number and a symbol.</p>
        <form className="form-grid one" onSubmit={changePassword}>
          <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={14} required /></label>
          <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={14} required /></label>
          <button className="primary" disabled={busy}>{busy ? "Changing password…" : "Change password"}</button>
        </form>
        {message && <p role={success ? "status" : "alert"} className={success ? "success" : "error"}>{message}</p>}
      </article>
      <article className="card"><h3>Security reminders</h3><ul className="check-list"><li>Use a password manager and a unique password</li><li>Sign out when using a shared device</li><li>Publishing actions require confirmation</li><li>Other sessions end after a password change</li></ul></article>
    </section>
  </div>;
}
