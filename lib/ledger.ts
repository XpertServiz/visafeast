// Pure TypeScript mirror of the SQL posting rules in supabase/migrations/0003_ledger_functions.sql.
// Used for previews in the admin ("this will record…") and for automated tests proving the books always balance.
export type LedgerType = "asset" | "liability" | "equity" | "income" | "expense";
export interface Line { code: string; debit?: number; credit?: number; memo?: string }
export interface Entry { group: number; date: string; code: string; debit: number; credit: number }

export const ACCOUNTS: Record<string, { name: string; type: LedgerType }> = {
  "1000": { name: "Cash in hand", type: "asset" }, "1100": { name: "Bank accounts", type: "asset" }, "1200": { name: "Wallets", type: "asset" },
  "1300": { name: "Money owed by clients", type: "asset" }, "2000": { name: "Client money held", type: "liability" },
  "2100": { name: "Commissions payable", type: "liability" }, "2200": { name: "Tax payable", type: "liability" },
  "3000": { name: "Owner's capital", type: "equity" }, "3100": { name: "Owner's drawings", type: "equity" },
  "4000": { name: "Service fees", type: "income" }, "4100": { name: "Other income", type: "income" },
  "5000": { name: "Rent", type: "expense" }, "5100": { name: "Partner commission", type: "expense" }, "5900": { name: "Other expenses", type: "expense" },
};
export const accountCode = (kind: "cash" | "bank" | "wallet") => (kind === "cash" ? "1000" : kind === "bank" ? "1100" : "1200");

export class Ledger {
  entries: Entry[] = [];
  private g = 0;
  locked = new Set<string>(); // "YYYY-MM"

  post(date: string, lines: Line[]): number {
    if (this.locked.has(date.slice(0, 7))) throw new Error("Month is closed");
    const d = lines.reduce((s, l) => s + (l.debit ?? 0), 0), c = lines.reduce((s, l) => s + (l.credit ?? 0), 0);
    if (d !== c) throw new Error(`Unbalanced entry: ${d} <> ${c}`);
    if (d === 0) throw new Error("Empty entry");
    const group = ++this.g;
    for (const l of lines) if ((l.debit ?? 0) || (l.credit ?? 0)) this.entries.push({ group, date, code: l.code, debit: l.debit ?? 0, credit: l.credit ?? 0 });
    return group;
  }

  invoice(date: string, o: { service: number; passThrough: number; discount?: number; tax?: number }) {
    const disc = o.discount ?? 0, tax = o.tax ?? 0, total = o.service + o.passThrough + tax - disc;
    const lines: Line[] = [{ code: "1300", debit: total }];
    if (o.service - disc) lines.push({ code: "4000", credit: o.service - disc });
    if (o.passThrough) lines.push({ code: "2000", credit: o.passThrough });
    if (tax) lines.push({ code: "2200", credit: tax });
    return this.post(date, lines);
  }
  payment(date: string, amount: number, kind: "cash" | "bank" | "wallet", hasInvoice = true) {
    return this.post(date, [{ code: accountCode(kind), debit: amount }, { code: hasInvoice ? "1300" : "2000", credit: amount }]);
  }
  expense(date: string, amount: number, kind: "cash" | "bank" | "wallet", code = "5900") {
    return this.post(date, [{ code, debit: amount }, { code: accountCode(kind), credit: amount }]);
  }
  passThroughPaid(date: string, amount: number, kind: "cash" | "bank" | "wallet") {
    return this.post(date, [{ code: "2000", debit: amount }, { code: accountCode(kind), credit: amount }]);
  }
  refund(date: string, amount: number, kind: "cash" | "bank" | "wallet", from: "service" | "client_money") {
    return this.post(date, [{ code: from === "service" ? "4000" : "2000", debit: amount }, { code: accountCode(kind), credit: amount }]);
  }
  transfer(date: string, amount: number, from: "cash" | "bank" | "wallet", to: "cash" | "bank" | "wallet") {
    return this.post(date, [{ code: accountCode(to), debit: amount }, { code: accountCode(from), credit: amount }]);
  }
  drawings(date: string, amount: number, kind: "cash" | "bank" | "wallet") {
    return this.post(date, [{ code: "3100", debit: amount }, { code: accountCode(kind), credit: amount }]);
  }
  reverse(group: number, date: string) {
    const src = this.entries.filter((e) => e.group === group);
    if (!src.length) throw new Error("Nothing to reverse");
    return this.post(date, src.map((e) => ({ code: e.code, debit: e.credit, credit: e.debit })));
  }

  isBalanced() { return this.entries.reduce((s, e) => s + e.debit - e.credit, 0) === 0; }
  balance(code: string) {
    const t = ACCOUNTS[code].type;
    const net = this.entries.filter((e) => e.code === code).reduce((s, e) => s + e.debit - e.credit, 0);
    return t === "asset" || t === "expense" ? net : 0 - net;
  }
  profit() {
    const sum = (type: LedgerType) => Object.keys(ACCOUNTS).filter((c) => ACCOUNTS[c].type === type).reduce((s, c) => s + this.balance(c), 0);
    return { income: sum("income"), expenses: sum("expense"), profit: sum("income") - sum("expense") };
  }
}
