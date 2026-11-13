import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { looksLike } from "../lib/portal";

const bytes = (...n: number[]) => new Uint8Array([...n, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const text = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));

describe("uploads must be what they claim to be", () => {
  it("accepts real files", () => {
    expect(looksLike("application/pdf", text("%PDF-1.7"))).toBe(true);
    expect(looksLike("image/jpeg", bytes(0xff, 0xd8, 0xff, 0xe0))).toBe(true);
    expect(looksLike("image/png", bytes(0x89, 0x50, 0x4e, 0x47))).toBe(true);
    expect(looksLike("image/webp", text("RIFF1234WEBPVP8 "))).toBe(true);
  });
  it("refuses a web page, a program or a script renamed as a document", () => {
    for (const mime of ["application/pdf", "image/jpeg", "image/png", "image/webp"]) {
      expect(looksLike(mime, text("<html><script>alert(1)</script>"))).toBe(false);
      expect(looksLike(mime, text("MZ\x90\x00 program"))).toBe(false);
    }
    expect(looksLike("text/html", text("<html>"))).toBe(false);
  });
});

describe("security settings stay in place", () => {
  const cfg = readFileSync("next.config.ts", "utf8");
  it("sends the protective headers", () => {
    for (const h of ["Strict-Transport-Security", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "Content-Security-Policy"]) expect(cfg).toContain(h);
    for (const d of ["object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'"]) expect(cfg).toContain(d);
  });
  it("only the dev server may use eval", () => { expect(cfg).toMatch(/\$\{dev \? " 'unsafe-eval'" : ""\}/); });
  it("login cookies are HttpOnly, Secure in production and SameSite", () => {
    expect(readFileSync("lib/server/admin-auth.ts", "utf8")).toMatch(/httpOnly: true[\s\S]*sameSite: "lax"/);
    expect(readFileSync("proxy.ts", "utf8")).toMatch(/httpOnly: true/);
  });
  it("every cookie-authenticated endpoint refuses requests from other websites", () => {
    for (const f of ["portal/upload-url", "portal/upload-done", "portal/messages", "admin/messages", "admin/upload-url", "admin/upload-done", "revalidate", "portal/login"]) expect(readFileSync(`app/api/${f}/route.ts`, "utf8"), f).toContain("crossSite(");
  });
  it("the service-role module is server-only", () => { expect(readFileSync("lib/supabase.ts", "utf8")).toContain('import "server-only"'); });
});
