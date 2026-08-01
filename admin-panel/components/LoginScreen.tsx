"use client";

import { useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setSuccess(false);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      onSignedIn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
    } finally { setBusy(false); }
  }

  async function requestPasswordReset() {
    const normalizedEmail = email.trim();
    setMessage("");
    setSuccess(false);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setMessage("Enter your staff email address first.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setSuccess(true);
      setMessage("Password recovery email sent. Open the newest message to choose a new password.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send the recovery email.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-shell">
    <section className="login-card">
      <div className="brand-mark"><b>Carrier</b><span>×</span><strong>Midea</strong></div>
      <p className="eyebrow">RED SEA CONTROL PANEL</p>
      <h1>Commercial operations, controlled.</h1>
      <p>Staff access only. Price, discount and public-setting changes are protected by database permissions and audit history.</p>
      <form onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <button className="password-reset-link" type="button" disabled={busy} onClick={requestPasswordReset}>Forgot password?</button>
        {message && <p className={success ? "success" : "error"} role={success ? "status" : "alert"}>{message}</p>}
      </form>
    </section>
  </main>;
}
