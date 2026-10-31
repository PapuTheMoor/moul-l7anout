import type { DomainResult, RecordedLine, RecordedTransaction, SaleProposal, ShopState, ShopSummary, TransactionProposal } from "./types";
import { normalizedCustomerName, validateProposal } from "./validation";

const fail = <T,>(error: string): DomainResult<T> => ({ ok: false, error });
const safe = (value: number) => Number.isSafeInteger(value) && value >= 0;

export function getSummary(state: ShopState): ShopSummary {
  return {
    salesCentimes: state.transactions.reduce((sum, t) => sum + (t.proposal.kind === "sale" ? t.totalCentimes : 0), 0),
    cashCentimes: state.transactions.reduce((sum, t) => sum + (t.proposal.kind === "repayment" || (t.proposal.kind === "sale" && t.proposal.payment === "cash") ? t.totalCentimes : 0), 0),
    creditCentimes: state.customers.reduce((sum, customer) => sum + customer.balanceCentimes, 0),
    transactionCount: state.transactions.length,
  };
}

function saleLines(state: ShopState, proposal: SaleProposal): DomainResult<readonly RecordedLine[]> {
  const grouped = proposal.lines.reduce<Record<string, number>>((lines, line) => ({ ...lines, [line.productId]: (lines[line.productId] || 0) + line.quantity }), {});
  const entries = Object.entries(grouped);
  const valid = entries.every(([id, quantity]) => {
    const product = state.products.find(p => p.id === id);
    return product && safe(quantity) && quantity > 0 && product.stock >= quantity && safe(product.priceCentimes * quantity);
  });
  if (!valid) return fail("Produit inconnu, quantité invalide ou stock insuffisant.");
  return { ok: true, value: entries.map(([productId, quantity]) => ({ productId, quantity, unitPriceCentimes: state.products.find(p => p.id === productId)!.priceCentimes })) };
}

function recordSale(state: ShopState, proposal: SaleProposal, recordedAt: string): DomainResult<ShopState> {
  if (proposal.customerId && !state.customers.some(c => c.id === proposal.customerId)) return fail("Choisissez un client du carnet.");
  if (proposal.payment === "credit" && !proposal.customerId) return fail("Un achat à crédit nécessite un client.");
  const result = saleLines(state, proposal);
  if (!result.ok) return result;
  const lines = result.value;
  const totalCentimes = lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCentimes, 0);
  if (!safe(totalCentimes) || totalCentimes < 1) return fail("Le montant de cette vente est invalide.");
  const customers = state.customers.map(c => proposal.payment === "credit" && c.id === proposal.customerId ? { ...c, balanceCentimes: c.balanceCentimes + totalCentimes } : c);
  if (!customers.every(c => safe(c.balanceCentimes))) return fail("Le solde du client dépasse la limite autorisée.");
  const normalized = { ...proposal, lines: lines.map(({ productId, quantity }) => ({ productId, quantity })) };
  const transaction: RecordedTransaction = { proposal: normalized, totalCentimes, recordedAt, lines };
  const products = state.products.map(p => ({ ...p, stock: p.stock - (lines.find(l => l.productId === p.id)?.quantity || 0) }));
  return { ok: true, value: { ...state, products, customers, transactions: [...state.transactions, transaction] } };
}

function recordRepayment(state: ShopState, proposal: TransactionProposal & { kind: "repayment" }, recordedAt: string): DomainResult<ShopState> {
  const customer = state.customers.find(c => c.id === proposal.customerId);
  if (!customer) return fail("Choisissez un client du carnet.");
  if (proposal.amountCentimes > customer.balanceCentimes) return fail("Le remboursement dépasse le crédit restant du client.");
  const transaction: RecordedTransaction = { proposal, totalCentimes: proposal.amountCentimes, recordedAt, lines: [] };
  return { ok: true, value: { ...state, customers: state.customers.map(c => c.id === customer.id ? { ...c, balanceCentimes: c.balanceCentimes - proposal.amountCentimes } : c), transactions: [...state.transactions, transaction] } };
}

export function confirmTransaction(state: ShopState, proposal: TransactionProposal, recordedAt: string): DomainResult<ShopState> {
  const validated = validateProposal(proposal);
  if (!validated.ok) return validated;
  if (state.transactions.some(t => t.proposal.id === validated.value.id)) return { ok: true, value: state };
  if (state.transactions.length >= 2000) return fail("Le carnet de démonstration est plein. Exportez ou réinitialisez-le.");
  if (!Number.isFinite(Date.parse(recordedAt))) return fail("La date de cette opération est invalide.");
  const operation = validated.value;
  if (operation.kind === "customer") {
    const customerId = `customer-${operation.id}`;
    if (customerId.length > 120 || state.customers.some(c => c.id === customerId || normalizedCustomerName(c.name) === normalizedCustomerName(operation.name))) return fail("Ce client existe déjà ou son nom est invalide.");
    const transaction: RecordedTransaction = { proposal: operation, totalCentimes: 0, recordedAt, lines: [] };
    return { ok: true, value: { ...state, customers: [...state.customers, { id: customerId, name: operation.name, balanceCentimes: 0 }], transactions: [...state.transactions, transaction] } };
  }
  const result = operation.kind === "sale" ? recordSale(state, operation, recordedAt) : recordRepayment(state, operation, recordedAt);
  if (result.ok && !Object.values(getSummary(result.value)).every(safe)) return fail("Le total du carnet dépasse la limite autorisée.");
  return result;
}

export function undoLatest(state: ShopState): DomainResult<ShopState> {
  const last = state.transactions.at(-1);
  if (!last) return fail("Aucune opération à annuler.");
  const proposal = last.proposal;
  if (proposal.kind === "customer") {
    const customer = state.customers.find(c => c.id === `customer-${proposal.id}`);
    if (!customer || customer.balanceCentimes !== 0) return fail("Cette opération ne peut pas être annulée sans endommager le carnet.");
    return { ok: true, value: { ...state, customers: state.customers.filter(c => c.id !== customer.id), transactions: state.transactions.slice(0, -1) } };
  }
  const products = proposal.kind === "sale" ? state.products.map(p => ({ ...p, stock: p.stock + (last.lines.find(l => l.productId === p.id)?.quantity || 0) })) : state.products;
  const customers = state.customers.map(c => {
    if (c.id !== proposal.customerId) return c;
    if (proposal.kind === "repayment") return { ...c, balanceCentimes: c.balanceCentimes + last.totalCentimes };
    return proposal.payment === "credit" ? { ...c, balanceCentimes: c.balanceCentimes - last.totalCentimes } : c;
  });
  if (!products.every(p => safe(p.stock)) || !customers.every(c => safe(c.balanceCentimes))) return fail("Cette opération ne peut pas être annulée sans endommager le carnet.");
  return { ok: true, value: { ...state, products, customers, transactions: state.transactions.slice(0, -1) } };
}
