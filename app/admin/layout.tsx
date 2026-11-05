import type { Metadata } from "next";
import "../globals.css";
import { fontClassNames } from "@/lib/fonts";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Visafeast Admin", icons: siteConfig.icons, manifest: siteConfig.manifest, robots: { index: false, follow: false } };

// Admin has its own root layout (its own <html>) so it never inherits the public site's splash, tracker or footer.
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontClassNames} style={{ ["--font-display" as string]: "var(--f-fraunces)", ["--font-body" as string]: "var(--f-inter)", ["--font-mono" as string]: "var(--f-plex)", ["--font-urdu" as string]: "var(--f-nastaliq)" }}>
      <body>{children}</body>
    </html>
  );
}
