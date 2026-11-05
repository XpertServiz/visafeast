import Image from "next/image";
import { getPhotoMap } from "@/lib/media";

/**
 * One component for every photo slot. Shows the chosen royalty-free photo (picked in Admin → Website → Photos, or set in
 * lib/photos.ts), or — if none is set yet — a neutral "Photo coming soon" placeholder with a FIXED aspect ratio,
 * so the layout never shifts or breaks (brief §4).
 */
export async function Photo({
  slot, aspect = "4 / 3", sizes = "(max-width: 960px) 100vw, 33vw", priority = false, rounded = 18, locale = "en", className,
}: { slot: string; aspect?: string; sizes?: string; priority?: boolean; rounded?: number; locale?: "en" | "ur"; className?: string }) {
  const p = (await getPhotoMap())[slot];
  const alt = (locale === "ur" && p?.alt_ur) || p?.alt || "";
  const style = { aspectRatio: aspect, borderRadius: rounded, overflow: "hidden", position: "relative" as const, width: "100%" };
  if (!p?.src) {
    return (
      <div className={`photo-ph ${className ?? ""}`} style={style} role="img" aria-label={alt}>
        <span>Photo coming soon</span>
      </div>
    );
  }
  return (
    <div className={className} style={style}>
      <Image src={p.src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: "cover" }} />
    </div>
  );
}
