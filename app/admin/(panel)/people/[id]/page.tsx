import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { db } from "@/lib/server/admin-data";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { waLink } from "@/config/site";
import { Card, Grid, Title } from "@/components/admin/ui";
import { ClientFile } from "@/components/admin/ClientFile";

export const dynamic = "force-dynamic";

export default async function Client({ params }: { params: Promise<{ id: string }> }) {
  const a = (await getAdmin())!;
  if (!can.people(a.role)) redirect("/admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const d = db();
  const [{ data: p }, { data: cases }] = await Promise.all([
    d.from("people").select("id,full_name,whatsapp,email,notes").eq("id", id).maybeSingle(),
    d.from("cases").select("ref,service_type,stage").eq("person_id", id).is("deleted_at", null),
  ]);
  if (!p) notFound();
  return (
    <>
      <Title sub={[p.whatsapp, p.email].filter(Boolean).join(" · ")}>{p.full_name ?? "Client"}</Title>
      <Grid min={320}>
        <Card title="Cases">
          {cases?.length ? cases.map((c) => <p key={c.ref} style={{ margin: "6px 0" }}><Link href={`/admin/cases/${c.ref}`} className="mono">{c.ref}</Link> · {c.service_type} · {c.stage}</p>) : <p style={{ margin: 0, color: "var(--muted)" }}>No case yet. <Link href="/admin/cases#new">Start one</Link>.</p>}
          {p.whatsapp && <a className="btn btn-wa" style={{ marginTop: 10 }} target="_blank" rel="noreferrer" href={waLink(undefined, p.whatsapp)}><MessageCircle size={18} aria-hidden />WhatsApp</a>}
          {p.notes && <p style={{ marginBottom: 0, color: "var(--muted)", fontSize: 15 }}>{p.notes}</p>}
        </Card>
        <ClientFile personId={p.id} path={`/admin/people/${p.id}`} />
      </Grid>
    </>
  );
}
