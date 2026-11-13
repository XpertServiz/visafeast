import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { leadQuery, type LeadFilters } from "../page";

export const dynamic = "force-dynamic";

// A cell that starts with = + - @ could run as a formula when the file is opened in Excel, so it gets a leading apostrophe.
const cell = (v: unknown) => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };

/** CSV of the leads that match the same filters as the list. Staff only. */
export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can.people(admin.role)) return NextResponse.json({ ok: false }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const f: LeadFilters = Object.fromEntries(["status", "country", "purpose", "from", "to", "q", "contacted"].map((k) => [k, sp.get(k) ?? undefined]));
  const { data } = await leadQuery(f, "created_at,status,name,phone,city,visitor_country,purpose,target_country,family_size,balance_lacs,program,contacted,p1,p2,utm", 5000);
  const cols = ["created_at", "status", "name", "phone", "city", "visitor_country", "purpose", "target_country", "family_size", "balance_lacs", "program", "contacted", "p1", "p2", "utm"];
  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => cols.map((c) => cell(c === "utm" ? JSON.stringify(r[c] ?? {}) : r[c])).join(","));
  return new NextResponse("﻿" + [cols.join(","), ...rows].join("\r\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="aiman-leads-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
}
