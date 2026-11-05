import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { Title } from "@/components/admin/ui";

const TABS = [["countries", "Pages & countries"], ["news", "News & digest"], ["faqs", "FAQs"], ["photos", "Photos"], ["appearance", "Appearance"], ["seo", "SEO"]] as const;

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const a = await getAdmin();
  if (!a || !can.website(a.role)) redirect("/admin");
  return (
    <>
      <Title sub="Everything visitors see on visafeast.com.">Website</Title>
      <nav aria-label="Website sections" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {TABS.map(([k, l]) => <Link key={k} href={`/admin/website/${k}`} className="chip" style={{ textDecoration: "none", fontSize: 15, padding: "10px 16px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>{l}</Link>)}
      </nav>
      {children}
    </>
  );
}
