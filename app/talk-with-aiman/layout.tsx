import type { Metadata } from "next";
import "../globals.css";
import "./aiman.css";
import { fontClassNames } from "@/lib/fonts";
import { siteConfig } from "@/config/site";

// An ad landing page: kept out of Google. Like the admin, it has its own <html> so it has no site header, splash or footer.
export const metadata: Metadata = {
  title: "Talk with Aiman | Visafeast",
  description: "Answer a few quick questions and find out which visa programs you qualify for.",
  robots: { index: false, follow: false },
  icons: siteConfig.icons,
};
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const };

export default function AimanRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontClassNames}>
      <body className="aiman-root">{children}</body>
    </html>
  );
}
