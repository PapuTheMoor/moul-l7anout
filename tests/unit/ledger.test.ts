import { describe, expect, it } from "vitest";
import { SAMPLE_SHOP } from "../../src/data/seed";
import { confirmTransaction, getSummary, undoLatest } from "../../src/domain/ledger";
import type { DomainResult, SaleProposal, ShopState, TransactionProposal } from "../../src/domain/types";

const sale: SaleProposal = { id: "sale-1", originalInput: "Ahmed khda jouj l7lib", source: "typed", kind: "sale", payment: "credit", customerId: "ahmed", lines: [{ productId: "milk", quantity: 2 }] };
const now = "2026-10-31T12:00:00.000Z";
function value(result: DomainResult<ShopState>) { if (!result.ok) throw new Error(result.error); return result.value; }

describe("immutable shop ledger", () => {
  it("creates a customer immutably, allows credit, and undoes in order", () => {
    const proposal = { id: "new-1", originalInput: "زيد زبون سارة", source: "speech", kind: "customer", name: "  سارة  " } as const;
    const created = value(confirmTransaction(SAMPLE_SHOP, proposal, now));
    expect(created.customers.at(-1)).toEqual({ id: "customer-new-1", name: "سارة", balanceCentimes: 0 });
    expect(value(confirmTransaction(created, proposal, now))).toBe(created);
    const bought = value(confirmTransaction(created, { ...sale, id: "new-sale", customerId: "customer-new-1" }, now));
    expect(bought.customers.at(-1)?.balanceCentimes).toBe(1400);
    expect(value(undoLatest(bought))).toEqual(created);
    expect(value(undoLatest(created))).toEqual(SAMPLE_SHOP);
  });

  it("rejects empty and duplicate customer names", () => {
    const proposal = { id: "new-1", originalInput: "new customer", source: "speech", kind: "customer", name: " " } as const;
    expect(confirmTransaction(SAMPLE_SHOP, proposal, now).ok).toBe(false);
    expect(confirmTransaction(SAMPLE_SHOP, { ...proposal, name: " ahmed " }, now).ok).toBe(false);
  });
  it("records credit without cash and captures the actual unit price", () => {
    const before = JSON.stringify(SAMPLE_SHOP);
    const state = value(confirmTransaction(SAMPLE_SHOP, sale, now));
    expect(state.products.find(p => p.id === "milk")?.stock).toBe(22);
    expect(state.customers.find(c => c.id === "ahmed")?.balanceCentimes).toBe(4900);
    expect(state.transactions[0].lines).toEqual([{ productId: "milk", quantity: 2, unitPriceCentimes: 700 }]);
    expect(getSummary(state)).toEqual({ salesCentimes: 1400, cashCentimes: 0, creditCentimes: 6900, transactionCount: 1 });
    expect(JSON.stringify(SAMPLE_SHOP)).toBe(before);
  });

  it("settles debt without increasing sales or altering inventory", () => {
    const bought = value(confirmTransaction(SAMPLE_SHOP, sale, now));
    const repaid = value(confirmTransaction(bought, { id: "pay-1", originalInput: "Ahmed khlles 49 dirham", source: "sample", kind: "repayment", customerId: "ahmed", amountCentimes: 4900 }, now));
    expect(repaid.customers.find(c => c.id === "ahmed")?.balanceCentimes).toBe(0);
    expect(repaid.products).toEqual(bought.products);
    expect(getSummary(repaid)).toEqual({ salesCentimes: 1400, cashCentimes: 4900, creditCentimes: 2000, transactionCount: 2 });
    expect(value(undoLatest(repaid))).toEqual(bought);
    expect(value(undoLatest(bought))).toEqual(SAMPLE_SHOP);
  });

  it("records a cash sale without adding customer debt", () => {
    const state = value(confirmTransaction(SAMPLE_SHOP, { ...sale, payment: "cash", customerId: null }, now));
    expect(state.customers).toEqual(SAMPLE_SHOP.customers);
    expect(getSummary(state).cashCentimes).toBe(1400);
    expect(value(undoLatest(state))).toEqual(SAMPLE_SHOP);
  });

  it("treats a double confirm as the same transaction", () => {
    const state = value(confirmTransaction(SAMPLE_SHOP, sale, now));
    expect(value(confirmTransaction(state, sale, now))).toBe(state);
  });

  it("aggregates repeated lines before stock validation", () => {
    expect(confirmTransaction(SAMPLE_SHOP, { ...sale, lines: [{ productId: "milk", quantity: 15 }, { productId: "milk", quantity: 15 }] }, now).ok).toBe(false);
    const state = value(confirmTransaction(SAMPLE_SHOP, { ...sale, lines: [{ productId: "milk", quantity: 1 }, { productId: "milk", quantity: 1 }] }, now));
    expect(state.transactions[0].lines).toEqual([{ productId: "milk", quantity: 2, unitPriceCentimes: 700 }]);
  });

  it("uses recorded prices and total when undoing after a catalog price change", () => {
    const state = value(confirmTransaction(SAMPLE_SHOP, sale, now));
    const changed = { ...state, products: state.products.map(p => p.id === "milk" ? { ...p, priceCentimes: 1000 } : p) };
    const undone = value(undoLatest(changed));
    expect(undone.customers).toEqual(SAMPLE_SHOP.customers);
    expect(undone.products.find(p => p.id === "milk")?.stock).toBe(24);
  });

  it.each([
    { ...sale, lines: [] },
    { ...sale, customerId: null },
    { ...sale, customerId: "unknown" },
    { ...sale, lines: [{ productId: "unknown", quantity: 1 }] },
    ...[0, -1, 0.5, 25, Number.MAX_SAFE_INTEGER].map(quantity => ({ ...sale, lines: [{ productId: "milk", quantity }] })),
    { id: "repay", originalInput: "paid", source: "typed", kind: "repayment", customerId: "ahmed", amountCentimes: 3501 },
    { id: "repay", originalInput: "paid", source: "typed", kind: "repayment", customerId: "unknown", amountCentimes: 1 },
    { id: "repay", originalInput: "paid", source: "typed", kind: "repayment", customerId: "ahmed", amountCentimes: -1 },
  ])("rejects invalid proposals without changing the source", proposal => {
    const before = JSON.stringify(SAMPLE_SHOP);
    expect(confirmTransaction(SAMPLE_SHOP, proposal as TransactionProposal, now).ok).toBe(false);
    expect(JSON.stringify(SAMPLE_SHOP)).toBe(before);
  });

  it("rejects invalid dates and empty undo", () => {
    expect(confirmTransaction(SAMPLE_SHOP, sale, "bad date").ok).toBe(false);
    expect(undoLatest(SAMPLE_SHOP).ok).toBe(false);
  });
});
