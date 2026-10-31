import { describe, expect, it } from "vitest";
import { SAMPLE_SHOP } from "../../src/data/seed";
import { parseLocal } from "../../src/domain/local-parser";

function parse(text: string) { return parseLocal({ id: "draft-1", source: "sample", text }, SAMPLE_SHOP); }

describe("explicit local example parser", () => {
  it("offers a customer creation proposal for Arabic Darija and latin examples", () => {
    expect(parse("زيد زبون سارة")).toEqual({ ok: true, value: { id: "draft-1", source: "sample", originalInput: "زيد زبون سارة", kind: "customer", name: "سارة" } });
    expect(parse("ajouter client Sara")).toEqual({ ok: true, value: { id: "draft-1", source: "sample", originalInput: "ajouter client Sara", kind: "customer", name: "Sara" } });
    expect(parse("زيد زبون جديد سميتو ياسين")).toMatchObject({ ok: true, value: { kind: "customer", name: "ياسين" } });
    expect(parse("Ajoute un nouveau client Yassine")).toMatchObject({ ok: true, value: { kind: "customer", name: "Yassine" } });
  });
  it("recognizes an added multi-word customer in a local sale and repayment", () => {
    const state = { ...SAMPLE_SHOP, customers: [...SAMPLE_SHOP.customers, { id: "customer-new", name: "سارة العلوي", balanceCentimes: 1400 }] };
    const sale = parseLocal({ id: "sale", source: "speech", text: "سارة العلوي خذات جوج حليب بالكريدي" }, state);
    expect(sale.ok && sale.value.kind === "sale" && sale.value.customerId).toBe("customer-new");
    const payment = parseLocal({ id: "payment", source: "speech", text: "سارة العلوي خلص 14 درهم" }, state);
    expect(payment.ok && payment.value.kind === "repayment" && payment.value.customerId).toBe("customer-new");
  });
  it("understands the rehearsed credit phrase", () => {
    expect(parse("Ahmed khda jouj l7lib, mazal makhlessch")).toEqual({ ok: true, value: { id: "draft-1", source: "sample", originalInput: "Ahmed khda jouj l7lib, mazal makhlessch", kind: "sale", customerId: "ahmed", payment: "credit", lines: [{ productId: "milk", quantity: 2 }] } });
  });
  it("understands the cash example", () => {
    const result = parse("B3t jouj khobz cash");
    expect(result.ok && result.value.kind === "sale" && result.value.lines).toEqual([{ productId: "bread", quantity: 2 }]);
    expect(result.ok && result.value.kind === "sale" && result.value.payment).toBe("cash");
  });
  it("understands repayments and decimal dirhams", () => {
    const result = parse("Ahmed khlles 49 dirham");
    expect(result.ok && result.value.kind === "repayment" && result.value.amountCentimes).toBe(4900);
    const decimal = parse("Fatima a payé 12,50 dirhams");
    expect(decimal.ok && decimal.value.kind === "repayment" && decimal.value.amountCentimes).toBe(1250);
  });
  it("understands Arabic catalog aliases", () => {
    const result = parse("أحمد خدا جوج حليب بالكريدي");
    expect(result.ok && result.value.kind === "sale" && result.value.lines[0]).toEqual({ productId: "milk", quantity: 2 });
  });
  it.each(["", "Ahmed khda jouj chocolat credit", "Ahmed khda jouj l7lib et chocolat credit", "Ahmed khda l7lib", "Ahmed l7lib et khobz cash", "Someone took two milk", "Ahmed khlles", "Ahmed khlles -5 dirham", "B3t 1.5 khobz cash"])("refuses unsupported or ambiguous input %s", text => {
    expect(parse(text).ok).toBe(false);
  });
  it.each(["Ahmed Fatima khda jouj l7lib credit", "Ahmed khda jouj l7lib cash credit", "Hassan khda jouj l7lib credit", "Ahmed khlles 0 dirham", "Ahmed khlles 99999999999999999999 dirham"])("clarifies conflicting or invalid input %s", text => expect(parse(text).ok).toBe(false));
  it.each(["Ahmed khlles 49 dirham et 10 dirham", "Ahmed khlles 49 dirham demain"])("does not guess repayment intent %s", text => expect(parse(text).ok).toBe(false));
});
