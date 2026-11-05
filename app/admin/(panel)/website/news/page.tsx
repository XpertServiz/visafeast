import { db } from "@/lib/server/admin-data";
import { Badge, Card, Empty, Field, day } from "@/components/admin/ui";
import { fetchNewsNow, publishPost, saveNewsItem } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function NewsAdmin() {
  const d = db();
  const [{ data: sources }, { data: items }, { data: drafts }] = await Promise.all([
    d.from("news_sources").select("id,name,is_active,last_fetched_at,last_status"),
    d.from("news_items").select("id,title,url,published_at,is_relevant,what_it_means").order("published_at", { ascending: false }).limit(30),
    d.from("posts").select("id,title,body_md,status,generated_by").eq("type", "digest").order("created_at", { ascending: false }).limit(5),
  ]);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Weekly digest — approve before it goes live">
        {drafts?.length ? drafts.map((p) => (
          <form key={p.id} action={publishPost} style={{ display: "grid", gap: 8, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
            <input type="hidden" name="id" value={p.id} />
            <p style={{ margin: 0 }}><b>{p.title}</b> <Badge color={p.status === "published" ? "var(--ok)" : "var(--amber-text)"}>{p.status}</Badge> <span style={{ color: "var(--muted)", fontSize: 13 }}>{p.generated_by}</span></p>
            <textarea name="body_md" defaultValue={p.body_md} rows={6} className="field" aria-label="Digest text" />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" name="publish" value="1">Publish</button>
              <button className="btn btn-outline" name="publish" value="0">Keep as draft</button>
            </div>
          </form>
        )) : <Empty text="No digest yet. One is drafted every Monday morning." />}
      </Card>
      <Card title="News sources">
        {sources?.map((s) => <p key={s.id} style={{ margin: "6px 0" }}>{s.is_active ? "●" : "○"} {s.name} <span style={{ color: "var(--muted)", fontSize: 14 }}>— {s.last_status ?? "never fetched"} {s.last_fetched_at ? `(${day(s.last_fetched_at)})` : ""}</span></p>)}
        <form action={fetchNewsNow}><button className="btn btn-dark" style={{ marginTop: 10 }}>Fetch news now</button></form>
      </Card>
      <Card title="Latest items">
        {items?.length ? items.map((n) => (
          <form key={n.id} action={saveNewsItem} style={{ display: "grid", gap: 6, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
            <input type="hidden" name="id" value={n.id} />
            <a href={n.url} target="_blank" rel="noopener nofollow">{n.title}</a>
            <input name="what" defaultValue={n.what_it_means ?? ""} placeholder="What it means for Pakistani applicants (one line)" className="field" aria-label="What it means" />
            <div style={{ display: "flex", gap: 8 }}><button className="btn btn-outline" name="relevant" value="1">Save & show</button><button className="btn btn-outline" name="relevant" value="0">Hide</button></div>
          </form>
        )) : <Empty text="No news fetched yet. Press “Fetch news now”." />}
      </Card>
    </div>
  );
}
