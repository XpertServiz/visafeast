"use client";
import { useActionState } from "react";
import { signIn } from "../actions";
import { LogoMark } from "@/components/layout/Logo";

export default function Login() {
  const [state, action, pending] = useActionState(signIn, null as { error?: string } | null);
  return (
    <main className="sky" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form action={action} className="card" style={{ width: "min(420px, 100%)", padding: 28, display: "grid", gap: 14 }}>
        <LogoMark size={56} onDark={false} />
        <h1 className="disp" style={{ margin: 0, fontSize: 30 }}>Visafeast admin</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>Sign in to manage your website and business.</p>
        <div><label className="lbl" htmlFor="em">Email</label><input id="em" className="field" name="email" type="email" required autoComplete="email" /></div>
        <div><label className="lbl" htmlFor="pw">Password</label><input id="pw" className="field" name="password" type="password" required autoComplete="current-password" /></div>
        {state?.error && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>{state.error}</p>}
        <button className="btn btn-primary" disabled={pending} type="submit">{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
