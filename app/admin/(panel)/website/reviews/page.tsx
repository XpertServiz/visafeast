import { db } from "@/lib/server/admin-data";
import { siteConfig } from "@/config/site";
import { Badge, Card, Empty, Field, Grid, day } from "@/components/admin/ui";
import { addWhatsappReview, moderateReview } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function Reviews({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab === "approved" ? "approved" : (await searchParams).tab === "rejected" ? "rejected" : "pending";
  const { data } = await db().from("reviews").select("id,name,city,visa_type,rating,body,created_at,submitted_via,status").eq("status", tab).order("created_at", { ascending: false }).limit(50);
  const link = `${siteConfig.url}/reviews/write`;
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>{["pending", "approved", "rejected"].map((t) => <a key={t} className="chip" href={`?tab=${t}`} style={{ textDecoration: "none", background: t === tab ? "var(--navy)" : undefined, color: t === tab ? "#fff" : undefined }}>{t[0].toUpperCase() + t.slice(1)}</a>)}</div>
      <div style={{ display: "grid", gap: 12 }}>
        {data?.length ? data.map((r) => (
          <div key={r.id} className="card" style={{ padding: 16 }}>
            <p style={{ margin: 0 }}><b>{r.name}</b> {r.city && `· ${r.city}`} · {"★".repeat(r.rating)} <Badge color="var(--muted-2)">{r.submitted_via}</Badge> <span className="mono" style={{ fontSize: 12, color: "var(--muted-2)" }}>{day(r.created_at)}</span></p>
            <p style={{ margin: "8px 0 12px" }}>{r.body}</p>
            {/* Admin can approve, reject or hide — never edit the client's words (brief §9.3) */}
            <div style={{ display: "flex", gap: 8 }}>
              {r.status !== "approved" && <form action={moderateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="approved" /><button className="btn btn-primary">Approve</button></form>}
              {r.status !== "rejected" && <form action={moderateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="rejected" /><button className="btn btn-outline">{r.status === "approved" ? "Hide" : "Reject"}</button></form>}
            </div>
          </div>
        )) : <Empty text={tab === "pending" ? "No reviews waiting. Ask a happy client to leave one." : "Nothing here."} />}
      </div>
      <Grid min={340}>
        <div style={{ marginTop: 24 }}><Card title="Ask a client for a review">
          <p style={{ marginTop: 0, color: "var(--muted)" }}>Opens WhatsApp with a ready message. Replace nothing — just pick the client's chat.</p>
          <a className="btn btn-wa" href={`https://wa.me/?text=${encodeURIComponent(`Assalam-o-Alaikum, thank you for choosing Visafeast. Could you share your experience here? ${link}`)}`}>Request a review on WhatsApp</a>
        </Card></div>
        <div style={{ marginTop: 24 }}><Card title="Add a review a client sent you on WhatsApp">
          <form action={addWhatsappReview} style={{ display: "grid", gap: 10 }}>
            <Field label="Client name"><input name="name" required className="field" /></Field>
            <Field label="City"><input name="city" className="field" /></Field>
            <Field label="Stars (1–5)"><input name="rating" type="number" min={1} max={5} defaultValue={5} className="field" /></Field>
            <Field label="Their words (exactly as they sent them)"><textarea name="body" required minLength={10} rows={3} className="field" /></Field>
            <label style={{ display: "flex", gap: 8 }}><input type="checkbox" name="confirm" required style={{ width: 22, height: 22 }} />This client sent me this review and agreed to publish it.</label>
            <button className="btn btn-dark">Add review</button>
          </form>
        </Card></div>
      </Grid>
    </>
  );
}
