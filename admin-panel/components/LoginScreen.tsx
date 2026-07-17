"use client";

import { useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      onSignedIn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
    } finally { setBusy(false); }
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
        {message && <p className="error" role="alert">{message}</p>}
      </form>
    </section>
  </main>;
}
