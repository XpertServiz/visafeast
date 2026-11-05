import { db } from "@/lib/server/admin-data";
import { VideosEditor } from "@/components/admin/VideosEditor";
import { saveVideos } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function Videos() {
  const { data } = await db().from("hero_videos").select("youtube_url,title,caption,is_short,is_active").order("sort_order");
  return (
    <>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>Paste your YouTube links. They appear in a strip right below the top of the homepage.</p>
      <VideosEditor action={saveVideos} initial={(data ?? []).map((v) => ({ url: v.youtube_url, title: v.title ?? "", caption: v.caption ?? "", short: v.is_short, active: v.is_active }))} />
    </>
  );
}
