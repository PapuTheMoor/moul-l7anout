import { describe, expect, it } from "vitest";
import { SAMPLE_SHOP } from "../../src/data/seed";
import { confirmTransaction } from "../../src/domain/ledger";
import { validateShopState } from "../../src/domain/validation";

describe("persisted shop validation", () => {
  it("replays new customers and their transactions across reload and rejects fabricated customers", () => {
    const created = confirmTransaction(SAMPLE_SHOP, { id: "new", source: "speech", originalInput: "زيد زبون سارة", kind: "customer", name: "سارة" }, "2026-10-31T12:00:00.000Z");
    if (!created.ok) throw new Error(created.error);
    const sale = confirmTransaction(created.value, { id: "sale-new", source: "typed", originalInput: "credit", kind: "sale", payment: "credit", customerId: "customer-new", lines: [{ productId: "milk", quantity: 1 }] }, "2026-10-31T12:01:00.000Z");
    if (!sale.ok) throw new Error(sale.error);
    expect(validateShopState(JSON.parse(JSON.stringify(sale.value)))).toEqual(sale);
    expect(validateShopState({ ...created.value, transactions: [] }).ok).toBe(false);
    expect(validateShopState({ ...created.value, customers: created.value.customers.map(c => c.id === "customer-new" ? { ...c, name: "Other" } : c) }).ok).toBe(false);
  });
  it("accepts the sample shop and a real recorded roundtrip", () => {
    expect(validateShopState(SAMPLE_SHOP).ok).toBe(true);
    const result = confirmTransaction(SAMPLE_SHOP, { id: "a", source: "typed", originalInput: "cash sale", kind: "sale", payment: "cash", customerId: null, lines: [{ productId: "milk", quantity: 2 }] }, "2026-10-31T12:00:00.000Z");
    if (!result.ok) throw new Error(result.error);
    expect(validateShopState(JSON.parse(JSON.stringify(result.value)))).toEqual(result);
  });

  it.each([null, {}, { ...SAMPLE_SHOP, version: 2 }, { ...SAMPLE_SHOP, products: [] }, { ...SAMPLE_SHOP, customers: [] }, { ...SAMPLE_SHOP, products: SAMPLE_SHOP.products.map(p => ({ ...p, stock: -1 })) }, { ...SAMPLE_SHOP, customers: [...SAMPLE_SHOP.customers, SAMPLE_SHOP.customers[0]] }, { ...SAMPLE_SHOP, transactions: [{ proposal: {} }] }])("rejects corrupt persistence", input => {
    expect(validateShopState(input).ok).toBe(false);
  });

  it("rejects changed balances without recorded transactions", () => {
    expect(validateShopState({ ...SAMPLE_SHOP, customers: SAMPLE_SHOP.customers.map(c => ({ ...c, balanceCentimes: 0 })) }).ok).toBe(false);
  });

  it("rejects inconsistent totals, repeated IDs and inventory", () => {
    const result = confirmTransaction(SAMPLE_SHOP, { id: "a", source: "typed", originalInput: "cash sale", kind: "sale", payment: "cash", customerId: null, lines: [{ productId: "milk", quantity: 2 }] }, "2026-10-31T12:00:00.000Z");
    if (!result.ok) throw new Error(result.error);
    const state = result.value;
    expect(validateShopState({ ...state, transactions: state.transactions.map(t => ({ ...t, totalCentimes: 1 })) }).ok).toBe(false);
    expect(validateShopState({ ...state, transactions: [...state.transactions, state.transactions[0]] }).ok).toBe(false);
    expect(validateShopState({ ...state, products: SAMPLE_SHOP.products }).ok).toBe(false);
  });

  it("validates credit and repayment history across a JSON reload", () => {
    const sale = confirmTransaction(SAMPLE_SHOP, { id: "sale", source: "typed", originalInput: "credit sale", kind: "sale", payment: "credit", customerId: "ahmed", lines: [{ productId: "milk", quantity: 2 }] }, "2026-10-31T12:00:00.000Z");
    if (!sale.ok) throw new Error(sale.error);
    const payment = confirmTransaction(sale.value, { id: "payment", source: "sample", originalInput: "Ahmed khlles 49 dirham", kind: "repayment", customerId: "ahmed", amountCentimes: 4900 }, "2026-10-31T12:01:00.000Z");
    if (!payment.ok) throw new Error(payment.error);
    expect(validateShopState(JSON.parse(JSON.stringify(payment.value)))).toEqual(payment);
    const transaction = payment.value.transactions[1];
    expect(validateShopState({ ...payment.value, transactions: [sale.value.transactions[0], { ...transaction, lines: [{ productId: "milk", quantity: 1, unitPriceCentimes: 700 }] }] }).ok).toBe(false);
    expect(validateShopState({ ...sale.value, transactions: sale.value.transactions.map(t => ({ ...t, proposal: { ...t.proposal, customerId: null } })) }).ok).toBe(false);
    expect(validateShopState({ ...sale.value, transactions: sale.value.transactions.map(t => ({ ...t, proposal: { ...t.proposal, customerId: "unknown" } })) }).ok).toBe(false);
  });

  it("rejects prices outside the fixed catalog and fabricated snapshots", () => {
    expect(validateShopState({ ...SAMPLE_SHOP, products: SAMPLE_SHOP.products.map(p => ({ ...p, priceCentimes: 1 })) }).ok).toBe(false);
    const result = confirmTransaction(SAMPLE_SHOP, { id: "a", source: "typed", originalInput: "cash sale", kind: "sale", payment: "cash", customerId: null, lines: [{ productId: "milk", quantity: 2 }] }, "2026-10-31T12:00:00.000Z");
    if (!result.ok) throw new Error(result.error);
    expect(validateShopState({ ...result.value, transactions: result.value.transactions.map(t => ({ ...t, lines: [...t.lines, ...t.lines] })) }).ok).toBe(false);
    expect(validateShopState({ ...result.value, transactions: result.value.transactions.map(t => ({ ...t, lines: [{ productId: "water", quantity: 2, unitPriceCentimes: 600 }] })) }).ok).toBe(false);
  });
});
