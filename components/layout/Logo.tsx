import Image from "next/image";
import { BRAND } from "@/lib/brand-dims";

/*
 * The Visafeast logo (the owner's logo, see scripts/make-brand-assets.py).
 * `onDark` picks the white-and-gold version for navy backgrounds; the original colours are for white and paper backgrounds.
 * The files are tiny (5-10 KB), so they are served as they are.
 */

/** The globe-and-plane mark on its own. */
export function LogoMark({ size = 34, onDark = true }: { size?: number; onDark?: boolean }) {
  return <Image src={`/brand/${onDark ? "mark-light" : "mark"}.webp`} alt="" width={BRAND.mark.w} height={BRAND.mark.h} unoptimized style={{ display: "block", height: size, width: "auto", flex: "none" }} />;
}

/** The "VISAFEAST" lettering on its own. */
export function WordMark({ height = 20, onDark = true }: { height?: number; onDark?: boolean }) {
  return <Image src={`/brand/${onDark ? "wordmark-light" : "wordmark"}.webp`} alt="Visafeast" width={BRAND.word.w} height={BRAND.word.h} unoptimized style={{ display: "block", height, width: "auto", flex: "none" }} />;
}

/** Mark and lettering side by side. `size` is the height of the mark; phones can make it smaller through the --bm variable (see globals.css). */
export function Brand({ size = 40, onDark = true, className = "" }: { size?: number; onDark?: boolean; className?: string }) {
  return (
    <span className={`brand ${className}`} style={{ ["--bm" as string]: `${size}px` }}>
      <Image className="brand-mark" src={`/brand/${onDark ? "mark-light" : "mark"}.webp`} alt="" width={BRAND.mark.w} height={BRAND.mark.h} unoptimized />
      <Image className="brand-word" src={`/brand/${onDark ? "wordmark-light" : "wordmark"}.webp`} alt="Visafeast" width={BRAND.word.w} height={BRAND.word.h} unoptimized />
    </span>
  );
}
