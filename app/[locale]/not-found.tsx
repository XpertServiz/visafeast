import Link from "next/link";

export default function NotFound() {
  const links = [["/visit-visa", "Visit visas"], ["/study-visa", "Study visas"], ["/immigration", "Immigration"], ["/tools/eligibility", "Eligibility check"], ["/contact", "Contact us"]];
  return (
    <div className="wrap" style={{ paddingBlock: 80, textAlign: "center" }}>
      <p className="mono" style={{ color: "var(--amber-text)", margin: 0 }}>ERROR 404</p>
      <h1 className="disp" style={{ fontSize: 48, margin: "8px 0" }}>This page has flown away</h1>
      <p style={{ color: "var(--muted)" }}>The page you wanted is not here. Try one of these:</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
        {links.map(([h, l]) => <Link key={h} href={h} className="btn btn-outline">{l}</Link>)}
      </div>
    </div>
  );
}
