import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { emailShell } from "../lib/server/notify";
import { siteConfig } from "../config/site";
import { BRAND } from "../lib/brand-dims";
import { MARK_LIGHT_DATA, WORDMARK_LIGHT_DATA } from "../lib/brand-data";

const file = (p: string) => fileURLToPath(new URL(`../public/${p.replace(/^\//, "")}`, import.meta.url));

describe("the logo", () => {
  it("every icon, sharing image and logo file the site points to exists", () => {
    const urls = [...siteConfig.icons.icon, ...siteConfig.icons.apple].map((i) => i.url);
    for (const u of [...urls, siteConfig.ogImage, siteConfig.logo, siteConfig.manifest, "/brand/mark.webp", "/brand/mark-light.webp", "/brand/wordmark.webp", "/brand/wordmark-light.webp", "/brand/email-header.png"]) {
      expect(existsSync(file(u)), u).toBe(true);
    }
  });
  it("the favicon is a real icon file", () => {
    const b = readFileSync(file("/favicon.ico"));
    expect([...b.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  });
  it("the web manifest names only icons that exist", () => {
    const m = JSON.parse(readFileSync(file(siteConfig.manifest), "utf8")) as { icons: { src: string }[]; name: string };
    expect(m.name).toBe("Visafeast");
    for (const i of m.icons) expect(existsSync(file(i.src)), i.src).toBe(true);
  });
  it("the pieces have real sizes, so pages reserve the right space", () => {
    expect(BRAND.mark.w).toBeGreaterThan(50); expect(BRAND.mark.h).toBeGreaterThan(50);
    expect(BRAND.word.w / BRAND.word.h).toBeGreaterThan(5);
    expect(MARK_LIGHT_DATA.startsWith("data:image/png;base64,")).toBe(true);
    expect(WORDMARK_LIGHT_DATA.startsWith("data:image/png;base64,")).toBe(true);
  });
  it("emails carry the logo banner and keep their message", () => {
    const h = emailShell("<p>New enquiry</p>");
    expect(h).toContain("/brand/email-header.png");
    expect(h).toContain("<p>New enquiry</p>");
    expect(h).toContain(siteConfig.url.replace(/\/$/, ""));
  });
  it("the logo files stay light (header pieces under 20 KB each, icons under 40 KB)", () => {
    const size = (p: string) => readFileSync(file(p)).length / 1024;
    for (const p of ["/brand/mark-light.webp", "/brand/wordmark-light.webp", "/brand/mark.webp", "/brand/wordmark.webp"]) expect(size(p), p).toBeLessThan(20);
    for (const p of ["/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/favicon.ico"]) expect(size(p), p).toBeLessThan(40);
  });
});
