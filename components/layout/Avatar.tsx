/** Zara's face: an illustration, not a photo of a real person. Blinks and has an online dot. To change her look, edit this drawing. */
export function ZaraAvatar({ size = 60, online = true }: { size?: number; online?: boolean }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" style={{ display: "block", borderRadius: "50%" }}>
        <circle cx="32" cy="32" r="32" fill="#0A1A33" />
        <path d="M10 64c1-13 10-20 22-20s21 7 22 20z" fill="#163463" />
        <path d="M32 9c-12 0-20 9-20 21 0 8 3 15 7 19 3 3 8 4 13 4s10-1 13-4c4-4 7-11 7-19 0-12-8-21-20-21z" fill="#F2A93B" />
        <path d="M32 16c-8 0-13 6-13 14 0 9 6 15 13 15s13-6 13-15c0-8-5-14-13-14z" fill="#E8B48E" />
        <path d="M19 28c3-6 8-9 13-9s10 3 13 9c-4-3-8-5-13-5s-9 2-13 5z" fill="#2B1B12" />
        <g className="zara-eyes"><ellipse cx="26" cy="31" rx="2.2" ry="2.6" fill="#2B1B12" /><ellipse cx="38" cy="31" rx="2.2" ry="2.6" fill="#2B1B12" /></g>
        <path d="M26.5 38.5c1.6 2.3 3.4 3.3 5.5 3.3s3.9-1 5.5-3.3" fill="none" stroke="#9C3D3D" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {online && <span aria-hidden style={{ position: "absolute", insetInlineEnd: 1, bottom: 1, width: Math.round(size * 0.22), height: Math.round(size * 0.22), borderRadius: "50%", background: "#25D366", border: "2px solid #fff" }} />}
    </span>
  );
}
