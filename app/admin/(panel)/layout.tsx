import Link from "next/link";
import { redirect } from "next/navigation";
import { Home, Users, Briefcase, Wallet, Globe, Settings as Cog, Plus, LogOut, Search } from "lucide-react";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { supabaseConfigured, serviceConfigured } from "@/lib/supabase";
import { Brand } from "@/components/layout/Logo";
import { signOut } from "../actions";
import { SetupNeeded } from "@/components/admin/ui";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured() || !serviceConfigured()) {
    return (
      <main className="wrap" style={{ paddingBlock: 60, maxWidth: 720 }}>
        <h1 className="disp">Visafeast admin</h1>
        <SetupNeeded what="The database (Supabase) is not connected, so the admin cannot sign anyone in" />
        <p><Link href="/">← Back to the website</Link></p>
      </main>
    );
  }
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const r = admin.role;
  const items = [
    { href: "/admin", label: "Today", icon: Home, ok: true },
    { href: "/admin/people", label: "People", icon: Users, ok: can.people(r) },
    { href: "/admin/cases", label: "Cases", icon: Briefcase, ok: can.people(r) },
    { href: "/admin/money", label: "Money", icon: Wallet, ok: can.money(r) },
    { href: "/admin/website", label: "Website", icon: Globe, ok: can.website(r) },
    { href: "/admin/settings", label: "Settings", icon: Cog, ok: can.settings(r) },
  ].filter((i) => i.ok);
  const link = { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, color: "#fff", textDecoration: "none", fontWeight: 500, minHeight: 48 } as const;
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside className="sky hide-sm" style={{ width: 230, flex: "none", padding: 16, display: "flex", flexDirection: "column", gap: 6, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 16px" }}><Brand size={32} /></div>
        {items.map((i) => <Link key={i.href} href={i.href} style={link}><i.icon size={20} aria-hidden />{i.label}</Link>)}
        <div style={{ marginTop: "auto" }}>
          <p style={{ color: "var(--on-navy-2)", fontSize: 13, margin: "0 8px 8px" }}>{admin.name ?? admin.email} · {r}</p>
          <form action={signOut}><button style={{ ...link, background: "transparent", border: 0, cursor: "pointer", width: "100%", font: "inherit" }}><LogOut size={20} aria-hidden />Sign out</button></form>
        </div>
      </aside>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 90 }}>
        <header style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "#fff" }}>
          <form action="/admin/search" style={{ flex: 1, display: "flex", gap: 8, maxWidth: 520 }} role="search">
            <input className="field" name="q" placeholder="Search people, phone numbers, case or invoice numbers" aria-label="Search" />
            <button className="btn btn-dark" aria-label="Search" style={{ minWidth: 48, padding: 0 }}><Search size={18} /></button>
          </form>
          <Link href="/" className="hide-sm" style={{ marginInlineStart: "auto" }}>View website</Link>
        </header>
        <div style={{ padding: 20, maxWidth: 1200 }}>{children}</div>
      </div>
      {/* floating + */}
      <details style={{ position: "fixed", right: 18, bottom: 84, zIndex: 40 }}>
        <summary aria-label="Add something" className="btn btn-primary" style={{ width: 60, height: 60, borderRadius: "50%", padding: 0, listStyle: "none", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}><Plus size={28} /></summary>
        <div className="card" style={{ position: "absolute", right: 0, bottom: 70, width: 220, padding: 8, display: "grid", gap: 2 }}>
          {[["New enquiry", "/admin/people#new"], ["Receive payment", "/admin/money#payment"], ["Add expense", "/admin/money#expense"], ["New case", "/admin/cases#new"]].map(([l, h]) => <Link key={h} href={h} style={{ padding: "12px 10px", textDecoration: "none", color: "var(--ink)", fontWeight: 600 }}>{l}</Link>)}
        </div>
      </details>
      {/* phone bottom bar */}
      <nav className="show-sm" aria-label="Main" style={{ position: "fixed", bottom: 0, insetInline: 0, background: "var(--navy)", display: "flex", zIndex: 30 }}>
        {items.slice(0, 5).map((i) => <Link key={i.href} href={i.href} style={{ flex: 1, color: "#fff", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", fontSize: 12, minHeight: 56, justifyContent: "center" }}><i.icon size={20} aria-hidden />{i.label}</Link>)}
      </nav>
    </div>
  );
}
