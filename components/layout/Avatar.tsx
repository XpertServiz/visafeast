import Image from "next/image";
import { GUIDE } from "@/lib/photos";

/** The assistant's face: the Visafeast guide, with an online dot. */
export function AimanAvatar({ size = 60, online = true }: { size?: number; online?: boolean }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: size, height: size, flex: `0 0 ${size}px` }}>
      <Image src={GUIDE.face.src} alt="" width={size} height={size} unoptimized style={{ display: "block", borderRadius: "50%", background: "#FBE9C9" }} />
      {online && <span aria-hidden style={{ position: "absolute", insetInlineEnd: 1, bottom: 1, width: Math.round(size * 0.22), height: Math.round(size * 0.22), borderRadius: "50%", background: "var(--amber)", border: "2px solid #fff" }} />}
    </span>
  );
}
