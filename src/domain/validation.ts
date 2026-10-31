import { z } from "zod";
import { SAMPLE_SHOP } from "../data/seed";
import type { DomainResult, RecordedTransaction, ShopState, TransactionProposal } from "./types";

const integer = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const positive = integer.min(1);
const id = z.string().min(1).max(120);
const base = { id, originalInput: z.string().min(1).max(1000), source: z.enum(["typed", "sample", "speech"]) };
const lineSchema = z.object({ productId: id, quantity: positive }).strict();
const saleSchema = z.object({ ...base, kind: z.literal("sale"), payment: z.enum(["cash", "credit"]), customerId: id.nullable(), lines: z.array(lineSchema).min(1).max(25) }).strict();
const repaymentSchema = z.object({ ...base, kind: z.literal("repayment"), customerId: id, amountCentimes: positive }).strict();
const customerProposalSchema = z.object({ ...base, kind: z.literal("customer"), name: z.string().trim().min(1).max(80).regex(/^[\p{L}\p{M}\s'’.-]+$/u).transform(name => name.replace(/\s+/g, " ")) }).strict();
const proposalSchema = z.discriminatedUnion("kind", [saleSchema, repaymentSchema, customerProposalSchema]);
const recordedLineSchema = lineSchema.extend({ unitPriceCentimes: positive }).strict();
const transactionSchema = z.object({ proposal: proposalSchema, totalCentimes: integer, recordedAt: z.string().datetime({ offset: true }), lines: z.array(recordedLineSchema).max(25) }).strict();
const productSchema = z.object({ id, name: z.string().min(1).max(80), aliases: z.array(z.string().min(1).max(60)).max(30), priceCentimes: positive, stock: integer }).strict();
const customerSchema = z.object({ id, name: z.string().min(1).max(80), balanceCentimes: integer }).strict();
const shopSchema = z.object({ version: z.literal(1), products: z.array(productSchema).length(5), customers: z.array(customerSchema).min(3).max(2003), transactions: z.array(transactionSchema).max(2000) }).strict();

const invalid = <T,>(error = "Ce carnet est endommagé. Réinitialisez les données de démonstration."): DomainResult<T> => ({ ok: false, error });
const safe = (n: number) => Number.isSafeInteger(n) && n >= 0;
export const normalizedCustomerName = (name: string) => name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
const sameIds = (actual: readonly { id: string }[], expected: readonly { id: string }[]) => actual.length === expected.length && new Set(actual.map(x => x.id)).size === expected.length && expected.every(x => actual.some(y => y.id === x.id));

export function validateProposal(input: unknown): DomainResult<TransactionProposal> {
  const result = proposalSchema.safeParse(input);
  return result.success ? { ok: true, value: result.data } : invalid("Vérifiez les quantités, le client et le montant de cette opération.");
}

function validSnapshot(transaction: RecordedTransaction): boolean {
  const proposal = transaction.proposal;
  if (proposal.kind === "customer") return transaction.lines.length === 0 && transaction.totalCentimes === 0;
  if (proposal.kind === "repayment") return transaction.lines.length === 0 && transaction.totalCentimes === proposal.amountCentimes;
  const quantities = proposal.lines.reduce<Record<string, number>>((all, line) => ({ ...all, [line.productId]: (all[line.productId] || 0) + line.quantity }), {});
  if (new Set(transaction.lines.map(l => l.productId)).size !== transaction.lines.length || Object.keys(quantities).length !== transaction.lines.length) return false;
  const validLines = transaction.lines.every(line => {
    const product = SAMPLE_SHOP.products.find(p => p.id === line.productId);
    return product && line.unitPriceCentimes === product.priceCentimes && line.quantity === quantities[line.productId] && safe(line.quantity * line.unitPriceCentimes);
  });
  return Boolean(validLines) && transaction.totalCentimes === transaction.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCentimes, 0);
}

function replay(state: ShopState): boolean {
  let stocks = Object.fromEntries(SAMPLE_SHOP.products.map(p => [p.id, p.stock]));
  let balances = Object.fromEntries(SAMPLE_SHOP.customers.map(c => [c.id, c.balanceCentimes]));
  let names = Object.fromEntries(SAMPLE_SHOP.customers.map(c => [c.id, c.name]));
  let sales = 0;
  let cash = 0;
  for (const transaction of state.transactions) {
    const p = transaction.proposal;
    if (!validSnapshot(transaction)) return false;
    if (p.kind === "customer") {
      const customerId = `customer-${p.id}`;
      if (Object.hasOwn(balances, customerId) || Object.values(names).some(name => normalizedCustomerName(name) === normalizedCustomerName(p.name))) return false;
      balances = { ...balances, [customerId]: 0 };
      names = { ...names, [customerId]: p.name };
      continue;
    }
    if (p.customerId !== null && !Object.hasOwn(balances, p.customerId)) return false;
    if (p.kind === "sale") {
      if (p.payment === "credit" && !p.customerId) return false;
      for (const line of transaction.lines) {
        if (!Object.hasOwn(stocks, line.productId)) return false;
        stocks = { ...stocks, [line.productId]: stocks[line.productId] - line.quantity };
      }
      sales += transaction.totalCentimes;
      if (p.payment === "cash") cash += transaction.totalCentimes;
      else balances = { ...balances, [p.customerId!]: balances[p.customerId!] + transaction.totalCentimes };
    } else {
      balances = { ...balances, [p.customerId]: balances[p.customerId] - transaction.totalCentimes };
      cash += transaction.totalCentimes;
    }
    if (![sales, cash, ...Object.values(stocks), ...Object.values(balances)].every(safe)) return false;
  }
  return state.products.every(p => stocks[p.id] === p.stock) && Object.keys(balances).length === state.customers.length && state.customers.every(c => balances[c.id] === c.balanceCentimes && names[c.id] === c.name);
}

export function validateShopState(input: unknown): DomainResult<ShopState> {
  const parsed = shopSchema.safeParse(input);
  if (!parsed.success) return invalid();
  const state = parsed.data;
  if (!sameIds(state.products, SAMPLE_SHOP.products) || new Set(state.customers.map(c => c.id)).size !== state.customers.length) return invalid();
  if (!state.products.every(p => SAMPLE_SHOP.products.some(seed => seed.id === p.id && seed.priceCentimes === p.priceCentimes))) return invalid();
  if (new Set(state.transactions.map(t => t.proposal.id)).size !== state.transactions.length || !replay(state)) return invalid();
  return { ok: true, value: state };
}
