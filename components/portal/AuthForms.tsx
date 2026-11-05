"use client";
import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import en from "@/messages/en.json";
import ur from "@/messages/ur.json";
import { Turnstile } from "@/components/tools/Turnstile";

type L = "en" | "ur";
const dict = (l: L) => (l === "ur" ? ur : en).portal;
const home = (l: L) => (l === "ur" ? "/ur/portal" : "/portal");
const post = async (url: string, body: unknown) => {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok && j.ok, error: j.error as string | undefined };
};

function Shell({ children, onSubmit, err, busy, button }: { children: React.ReactNode; onSubmit: (fd: FormData) => void; err: string; busy: boolean; button: string }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }} className="card" style={{ padding: 24, display: "grid", gap: 14, maxWidth: 480 }}>
      {children}
      {err && <p role="alert" style={{ color: "var(--bad)", margin: 0 }}>{err}</p>}
      <button className="btn btn-primary" disabled={busy}>{button}</button>
    </form>
  );
}
const Text = ({ id, label, ...p }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div><label className="lbl" htmlFor={id}>{label}</label><input id={id} className="field" required {...p} /></div>
);

export function LoginForm({ locale, code }: { locale: L; code?: string }) {
  const t = dict(locale);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  return (
    <>
      <Shell err={err} busy={busy} button={t.signIn} onSubmit={async (fd) => {
        setBusy(true); setErr("");
        const r = await post("/api/portal/login", { email: fd.get("email"), password: fd.get("password") });
        if (r.ok) { location.href = code ? `${home(locale)}/join?code=${encodeURIComponent(code)}` : home(locale); return; }
        setErr(locale === "ur" ? t.wrong : r.error || t.wrong); setBusy(false);
      }}>
        <Text id="pl-e" name="email" type="email" label={t.email} autoComplete="email" dir="ltr" />
        <Text id="pl-p" name="password" type="password" label={t.password} autoComplete="current-password" dir="ltr" />
      </Shell>
      <p style={{ maxWidth: 480 }}>{t.noAccount} <Link href={code ? `${home(locale)}/join?code=${encodeURIComponent(code)}` : `${home(locale)}/signup`}>{t.signUp}</Link></p>
      <p style={{ maxWidth: 480, color: "var(--muted)", fontSize: 15 }}>{t.forgot}</p>
    </>
  );
}

export function SignupForm({ locale, code }: { locale: L; code?: string }) {
  const t = dict(locale);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [token, setToken] = useState("");
  return (
    <>
      <Shell err={err} busy={busy} button={t.signUp} onSubmit={async (fd) => {
        setBusy(true); setErr("");
        const r = await post("/api/portal/signup", { name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"), password: fd.get("password"), website: fd.get("website") || undefined, code, turnstile: token });
        if (r.ok) { location.href = home(locale); return; }
        setErr(r.error || t.failed); setBusy(false);
      }}>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
        <Text id="ps-n" name="name" label={t.name} minLength={2} maxLength={80} autoComplete="name" />
        <Text id="ps-e" name="email" type="email" label={t.email} autoComplete="email" dir="ltr" />
        <Text id="ps-w" name="phone" type="tel" label={t.whatsapp} autoComplete="tel" inputMode="tel" placeholder="+92 3xx xxxxxxx" dir="ltr" />
        <Text id="ps-p" name="password" type="password" label={t.passwordNew} minLength={8} maxLength={72} autoComplete="new-password" dir="ltr" />
        <Turnstile onToken={setToken} />
      </Shell>
      <p style={{ maxWidth: 480 }}>{t.haveAccount} <Link href={`${home(locale)}/login${code ? `?code=${encodeURIComponent(code)}` : ""}`}>{t.signIn}</Link></p>
    </>
  );
}

export function JoinButton({ locale, code }: { locale: L; code: string }) {
  const t = dict(locale);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  return (
    <Shell err={err} busy={busy} button={t.linkFile} onSubmit={async () => {
      setBusy(true); setErr("");
      const r = await post("/api/portal/join", { code });
      if (r.ok) { location.href = home(locale); return; }
      setErr(r.error || t.failed); setBusy(false);
    }}><p style={{ margin: 0 }}>{t.linkIntro}</p></Shell>
  );
}

export function ResetForm({ locale, code }: { locale: L; code: string }) {
  const t = dict(locale);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [done, setDone] = useState(false);
  if (done) return <div className="card" style={{ padding: 24, maxWidth: 480 }}><p role="status" style={{ marginTop: 0, color: "var(--ok)" }}>{t.resetDone}</p><Link className="btn btn-primary" href={`${home(locale)}/login`}>{t.signIn}</Link></div>;
  return (
    <Shell err={err} busy={busy} button={t.resetButton} onSubmit={async (fd) => {
      setBusy(true); setErr("");
      const r = await post("/api/portal/reset", { code, password: fd.get("password") });
      if (r.ok) { setDone(true); return; }
      setErr(r.error || t.failed); setBusy(false);
    }}><Text id="pr-p" name="password" type="password" label={t.passwordNew} minLength={8} maxLength={72} autoComplete="new-password" dir="ltr" /></Shell>
  );
}

export function SignOutButton({ locale }: { locale: L }) {
  const t = dict(locale);
  return (
    <button type="button" className="btn btn-ghost" style={{ minHeight: 44 }} onClick={async () => { await fetch("/api/portal/login", { method: "DELETE" }); location.href = `${home(locale)}/login`; }}>
      <LogOut size={18} aria-hidden />{t.signOut}
    </button>
  );
}
