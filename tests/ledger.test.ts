import { describe, expect, it } from "vitest";
import { Ledger } from "../lib/ledger";

describe("ledger — every money action posts balanced entries", () => {
  it("invoice with service fee + embassy fee: only the service fee is income", () => {
    const l = new Ledger();
    l.invoice("2026-11-01", { service: 30000, passThrough: 20000 });
    expect(l.isBalanced()).toBe(true);
    expect(l.balance("1300")).toBe(50000); // owed by client
    expect(l.balance("4000")).toBe(30000); // income
    expect(l.balance("2000")).toBe(20000); // client money held — NOT income
    expect(l.profit().income).toBe(30000);
  });

  it("part-payment then full payment clears what the client owes", () => {
    const l = new Ledger();
    l.invoice("2026-11-01", { service: 30000, passThrough: 20000 });
    l.payment("2026-11-02", 10000, "cash");
    l.payment("2026-11-05", 40000, "bank");
    expect(l.balance("1300")).toBe(0);
    expect(l.balance("1000")).toBe(10000);
    expect(l.balance("1100")).toBe(40000);
    expect(l.isBalanced()).toBe(true);
  });

  it("paying the embassy fee for a client reduces client money, not profit", () => {
    const l = new Ledger();
    l.invoice("2026-11-01", { service: 30000, passThrough: 20000 });
    l.payment("2026-11-01", 50000, "bank");
    l.passThroughPaid("2026-11-03", 20000, "bank");
    expect(l.balance("2000")).toBe(0);
    expect(l.profit().profit).toBe(30000);
    expect(l.isBalanced()).toBe(true);
  });

  it("profit report = service income − expenses", () => {
    const l = new Ledger();
    l.invoice("2026-11-01", { service: 50000, passThrough: 0 });
    l.payment("2026-11-01", 50000, "bank");
    l.expense("2026-11-02", 12000, "cash", "5000");
    l.expense("2026-11-03", 3000, "wallet");
    expect(l.profit()).toEqual({ income: 50000, expenses: 15000, profit: 35000 });
  });

  it("discounts reduce income; advances are held as client money", () => {
    const l = new Ledger();
    l.invoice("2026-11-01", { service: 40000, passThrough: 0, discount: 5000 });
    expect(l.balance("4000")).toBe(35000);
    expect(l.balance("1300")).toBe(35000);
    l.payment("2026-11-02", 7000, "cash", false);
    expect(l.balance("2000")).toBe(7000);
    expect(l.profit().income).toBe(35000);
  });

  it("refunds, transfers and owner's drawings stay balanced", () => {
    const l = new Ledger();
    l.payment("2026-11-01", 100000, "bank", false);
    l.refund("2026-11-02", 10000, "bank", "client_money");
    l.transfer("2026-11-03", 20000, "bank", "cash");
    l.drawings("2026-11-04", 5000, "cash");
    expect(l.isBalanced()).toBe(true);
    expect(l.balance("1000")).toBe(15000);
    expect(l.balance("1100")).toBe(70000);
  });

  it("corrections are reversals, never edits", () => {
    const l = new Ledger();
    const g = l.expense("2026-11-02", 9000, "cash");
    l.reverse(g, "2026-11-02");
    expect(l.profit().expenses).toBe(0);
    expect(l.entries.length).toBe(4);
    expect(l.isBalanced()).toBe(true);
  });

  it("rejects unbalanced posts and posts into a closed month", () => {
    const l = new Ledger();
    expect(() => l.post("2026-11-01", [{ code: "1000", debit: 100 }, { code: "4000", credit: 90 }])).toThrow(/Unbalanced/);
    l.locked.add("2026-10");
    expect(() => l.expense("2026-10-15", 100, "cash")).toThrow(/closed/);
  });
});
