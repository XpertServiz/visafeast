import Link from "next/link";
import { redirect } from "next/navigation";
import { Home, Users, Briefcase, Wallet, Globe, Settings as Cog, Plus, LogOut, Search, Eye, Video, Star, BarChart3, History, Link2 } from "lucide-react";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { supabaseConfigured, serviceConfigured } from "@/lib/supabase";
import { Brand } from "@/components/layout/Logo";
import { serviceClient } from "@/lib/supabase";
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
  // the little numbers in the menu: new enquiries and reviews waiting
  const sb = serviceClient();
  const [newLeads, pendingReviews, signupRequests, docsToCheck] = sb ? await Promise.all([
    can.people(r) ? sb.from("leads").select("id", { count: "exact", head: true }).eq("status", "new") : Promise.resolve({ count: 0 }),
    can.website(r) ? sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending") : Promise.resolve({ count: 0 }),
    can.people(r) ? sb.from("people").select("id", { count: "exact", head: true }).eq("portal_status", "pending").is("deleted_at", null) : Promise.resolve({ count: 0 }),
    can.people(r) ? sb.from("case_documents").select("id", { count: "exact", head: true }).eq("status", "uploaded") : Promise.resolve({ count: 0 }),
  ]) : [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }];
  const items = [
    { href: "/admin", label: "Today", icon: Home, ok: true, badge: 0 },
    { href: "/admin/people", label: "People", icon: Users, ok: can.people(r), badge: newLeads.count ?? 0 },
    { href: "/admin/cases", label: "Client files", icon: Briefcase, ok: can.people(r), badge: (signupRequests.count ?? 0) + (docsToCheck.count ?? 0) },
    { href: "/admin/money", label: "Money", icon: Wallet, ok: can.money(r), badge: 0 },
    { href: "/admin/website", label: "Website", icon: Globe, ok: can.website(r), badge: 0 },
    { href: "/admin/visitors", label: "Visitors", icon: Eye, ok: can.website(r), badge: 0 },
    { href: "/admin/videos", label: "Videos", icon: Video, ok: can.website(r), badge: 0 },
    { href: "/admin/reviews", label: "Reviews", icon: Star, ok: can.website(r), badge: pendingReviews.count ?? 0 },
    { href: "/admin/links", label: "Useful links", icon: Link2, ok: can.website(r), badge: 0 },
    { href: "/admin/reports", label: "Reports", icon: BarChart3, ok: can.reports(r), badge: 0 },
    { href: "/admin/activity", label: "Activity log", icon: History, ok: can.reports(r), badge: 0 },
    { href: "/admin/settings", label: "Settings", icon: Cog, ok: can.settings(r), badge: 0 },
  ].filter((i) => i.ok);
  const dot = (n: number) => n > 0 && <span aria-label={`${n} waiting`} style={{ marginInlineStart: "auto", background: "var(--amber)", color: "var(--navy)", borderRadius: 99, minWidth: 22, height: 22, padding: "0 6px", fontSize: 12, fontWeight: 700, display: "inline-grid", placeItems: "center" }}>{n}</span>;
  const link = { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, color: "#fff", textDecoration: "none", fontWeight: 500, minHeight: 48 } as const;
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside className="sky hide-sm" style={{ width: 230, flex: "none", padding: 16, display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 16px" }}><Brand size={32} /></div>
        {items.map((i) => <Link key={i.href} href={i.href} style={link}><i.icon size={20} aria-hidden />{i.label}{dot(i.badge)}</Link>)}
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
      <nav className="show-sm" aria-label="Main" style={{ position: "fixed", bottom: 0, insetInline: 0, background: "var(--navy)", display: "flex", zIndex: 30, overflowX: "auto" }}>
        {items.map((i) => <Link key={i.href} href={i.href} style={{ flex: "1 0 72px", position: "relative", color: "#fff", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", fontSize: 12, minHeight: 56, justifyContent: "center" }}><i.icon size={20} aria-hidden />{i.label}{i.badge > 0 && <span aria-label={`${i.badge} waiting`} style={{ position: "absolute", top: 4, insetInlineEnd: 14, background: "var(--amber)", color: "var(--navy)", borderRadius: 99, minWidth: 18, height: 18, fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center" }}>{i.badge}</span>}</Link>)}
      </nav>
    </div>
  );
}
