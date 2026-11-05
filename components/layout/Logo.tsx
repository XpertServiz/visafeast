export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="15" fill="none" stroke="#F2A93B" strokeWidth="2" />
      <circle cx="17" cy="17" r="11" fill="none" stroke="#F2A93B" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M10 18 L24 12 L20 17 L24 22 Z" fill="#F2A93B" />
    </svg>
  );
}
