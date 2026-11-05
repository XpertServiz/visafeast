import Link from "next/link";
import { db } from "@/lib/server/admin-data";
import { Card, Empty, Title } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").replace(/[%,()]/g, "").trim();
  const d = db();
  const [people, cases, invoices] = q ? await Promise.all([
    d.from("people").select("id,full_name,whatsapp").or(`full_name.ilike.%${q}%,whatsapp.ilike.%${q}%`).limit(10),
    d.from("cases").select("ref,service_type").ilike("ref", `%${q}%`).limit(10),
    d.from("invoices").select("number").ilike("number", `%${q}%`).limit(10),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  const none = !people.data?.length && !cases.data?.length && !invoices.data?.length;
  return (
    <>
      <Title sub={q ? `Results for "${q}"` : "Type a name, phone number, case number or invoice number."}>Search</Title>
      {q && none ? <Empty text="Nothing found." /> : (
        <div style={{ display: "grid", gap: 14 }}>
          {!!people.data?.length && <Card title="People">{people.data.map((p) => <p key={p.id} style={{ margin: "6px 0" }}><Link href={`/admin/people?q=${encodeURIComponent(p.whatsapp ?? p.full_name ?? "")}`}>{p.full_name}</Link> · {p.whatsapp}</p>)}</Card>}
          {!!cases.data?.length && <Card title="Cases">{cases.data.map((c) => <p key={c.ref} style={{ margin: "6px 0" }}><Link href={`/admin/cases/${c.ref}`}>{c.ref}</Link> · {c.service_type}</p>)}</Card>}
          {!!invoices.data?.length && <Card title="Invoices">{invoices.data.map((i) => <p key={i.number} style={{ margin: "6px 0" }}><Link href="/admin/money#invoice">{i.number}</Link></p>)}</Card>}
        </div>
      )}
    </>
  );
}
