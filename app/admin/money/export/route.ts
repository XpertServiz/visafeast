import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, can } from "@/lib/server/admin-auth";
import { serviceClient } from "@/lib/supabase";

/** Owner-only CSV export of the books for an accountant (opens in Excel). */
export async function GET(req: NextRequest) {
  const a = await getAdmin(); const db = serviceClient();
  if (!a || !db || !can.reports(a.role)) return new NextResponse("Not allowed", { status: 403 });
  const from = req.nextUrl.searchParams.get("from") ?? "1970-01-01", to = req.nextUrl.searchParams.get("to") ?? "2999-12-31";
  const { data } = await db.from("ledger_entries").select("entry_date,ledger_code,debit_pkr,credit_pkr,memo,entry_group").gte("entry_date", from).lte("entry_date", to).order("entry_date").order("id");
  const { data: acc } = await db.from("ledger_accounts").select("code,name");
  const name = new Map((acc ?? []).map((x) => [x.code, x.name]));
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = ["Date,Account,Debit (PKR),Credit (PKR),Memo,Group", ...(data ?? []).map((r) => [r.entry_date, esc(name.get(r.ledger_code) ?? r.ledger_code), r.debit_pkr, r.credit_pkr, esc(r.memo), r.entry_group].join(","))].join("\n");
  return new NextResponse("﻿" + csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="visafeast-books-${from}-to-${to}.csv"` } });
}
