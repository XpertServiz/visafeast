import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { db } from "@/lib/server/admin-data";
import { VideoAdd } from "@/components/admin/VideoAdd";
import { Badge, Card, Empty, Title } from "@/components/admin/ui";
import { addVideo, changeVideo } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Videos" };

export default async function Videos() {
  const admin = await getAdmin();
  if (!admin || !can.website(admin.role)) redirect("/admin");
  const { data } = await db().from("hero_videos").select("id,video_id,title,caption,is_short,is_active").order("sort_order").order("created_at");
  const list = data ?? [];
  const shown = list.filter((v) => v.is_active).length;
  const btn = { minHeight: 44, minWidth: 44, padding: 0 } as const;
  const act = (id: string, what: string, label: string, icon: React.ReactNode, danger = false) => (
    <form action={changeVideo}><input type="hidden" name="id" value={id} /><input type="hidden" name="what" value={what} />
      <button className="btn btn-outline" aria-label={label} title={label} style={{ ...btn, color: danger ? "var(--bad)" : undefined }}>{icon}</button></form>
  );
  return (
    <>
      <Title sub="Paste a YouTube link and press Add. Add as many as you like. Unlisted videos work too. They show in a strip near the top of the homepage.">Videos</Title>
      <Card title="Add a video"><VideoAdd action={addVideo} /></Card>
      <h2 className="disp" style={{ margin: "28px 0 6px" }}>Your videos ({list.length})</h2>
      <p style={{ margin: "0 0 12px", color: "var(--muted)" }}>{list.length ? `${shown} showing on the homepage. 1–3 videos sit side by side; 4 or more become a swipeable slider.` : ""}</p>
      {list.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((v, i) => (
            <div key={v.id} className="card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", opacity: v.is_active ? 1 : 0.6 }}>
              <Image src={`https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`} alt="" width={128} height={72} style={{ borderRadius: 8, objectFit: "cover", flex: "none" }} />
              <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                <b style={{ display: "block", overflowWrap: "anywhere" }}>{v.title || "Untitled video"}</b>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>{v.caption ?? ""}</span>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  <Badge color={v.is_active ? "var(--navy)" : "var(--muted-2)"}>{v.is_active ? "Showing" : "Hidden"}</Badge>
                  {v.is_short && <Badge color="var(--muted-2)">Short</Badge>}
                  <a className="mono" style={{ fontSize: 12 }} href={`https://www.youtube.com/watch?v=${v.video_id}`} target="_blank" rel="noreferrer noopener">Open on YouTube</a>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {i > 0 && act(v.id, "up", "Move up", <ArrowUp size={18} />)}
                {i < list.length - 1 && act(v.id, "down", "Move down", <ArrowDown size={18} />)}
                {act(v.id, v.is_active ? "hide" : "show", v.is_active ? "Hide from website" : "Show on website", v.is_active ? <EyeOff size={18} /> : <Eye size={18} />)}
                {act(v.id, "remove", "Remove video", <Trash2 size={18} />, true)}
              </div>
            </div>
          ))}
        </div>
      ) : <Empty text="No videos yet. Paste your first YouTube link above." />}
    </>
  );
}
