import { getPhotoMap } from "@/lib/media";
import { PHOTOS } from "@/lib/photos";
import { pexelsConfigured, searchPexels } from "@/lib/server/pexels";
import { Card, Empty, Field } from "@/components/admin/ui";
import { choosePexelsPhoto, removePhoto, uploadOwnPhoto } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function Photos({ searchParams }: { searchParams: Promise<{ slot?: string; q?: string }> }) {
  const sp = await searchParams;
  const map = await getPhotoMap();
  const slots = Object.keys(PHOTOS);
  const slot = sp.slot && slots.includes(sp.slot) ? sp.slot : "";
  const q = (sp.q ?? "").trim();
  const results = slot && q ? await searchPexels(q) : [];
  const hasKey = pexelsConfigured();

  return (
    <>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>Every picture on the website has a place. Pick a free photo from Pexels (free for business use) or upload your own. Credit and licence are saved automatically.</p>
      {!hasKey && <Card tone="warn"><p style={{ margin: 0 }}><b>Photo search is not connected yet.</b> It needs a free Pexels key (README → “Photo search”). You can still upload your own photos below.</p></Card>}

      {slot && (
        <div style={{ margin: "16px 0" }}>
          <Card title={`Choose a photo for: ${slot}`}>
            <p style={{ margin: "0 0 12px", color: "var(--muted)" }}>Suggested picture: {PHOTOS[slot].alt}</p>
            {hasKey && (
              <form style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <input type="hidden" name="slot" value={slot} />
                <input name="q" defaultValue={q || PHOTOS[slot].alt.split("—")[0]} className="field" style={{ flex: 1, minWidth: 200 }} aria-label="Search words" />
                <button className="btn btn-primary">Search photos</button>
              </form>
            )}
            {results.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {results.map((p) => (
                  <form key={p.id} action={choosePexelsPhoto} className="card" style={{ padding: 8 }}>
                    <input type="hidden" name="slot" value={slot} /><input type="hidden" name="photo_id" value={p.id} /><input type="hidden" name="alt" value={PHOTOS[slot].alt} />
                    <img src={p.thumb} alt={p.alt || "Pexels photo"} loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 10 }} />
                    <p style={{ margin: "6px 0", fontSize: 12, color: "var(--muted)" }}>by {p.photographer}</p>
                    <button className="btn btn-dark" style={{ minHeight: 44, width: "100%" }}>Use this photo</button>
                  </form>
                ))}
              </div>
            )}
            {hasKey && q && !results.length && <Empty text="No photos found. Try other words." />}
            <details style={{ marginTop: 14 }}>
              <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Or upload my own photo</summary>
              <form action={uploadOwnPhoto} style={{ display: "grid", gap: 10 }}>
                <input type="hidden" name="slot" value={slot} />
                <Field label="Photo (JPG, PNG or WebP, up to 10 MB)"><input type="file" name="file" accept="image/jpeg,image/png,image/webp" required className="field" /></Field>
                <Field label="Describe the photo (for blind visitors and Google)"><input name="alt" defaultValue={PHOTOS[slot].alt} className="field" /></Field>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="mine" /> I own this photo or have the right to use it on the website</label>
                <button className="btn btn-primary">Upload</button>
              </form>
            </details>
          </Card>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginTop: 16 }}>
        {slots.map((k) => {
          const m = map[k];
          return (
            <div key={k} className="card" style={{ padding: 10 }}>
              {m?.src
                ? <img src={m.src} alt={m.alt} loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 10 }} />
                : <div className="photo-ph" style={{ aspectRatio: "4 / 3", borderRadius: 10 }}>No photo yet</div>}
              <p style={{ margin: "8px 0 2px", fontWeight: 600 }}>{k}</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{m?.credit ? `Photo: ${m.credit}${m.licence ? ` · ${m.licence}` : ""}` : PHOTOS[k].alt}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <a className="btn btn-outline" style={{ minHeight: 44, flex: 1 }} href={`/admin/website/photos?slot=${k}#top`}>{m?.src ? "Change" : "Choose"}</a>
                {m?.src && <form action={removePhoto}><input type="hidden" name="slot" value={k} /><button className="btn btn-outline" style={{ minHeight: 44 }} aria-label={`Remove photo ${k}`}>Remove</button></form>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
