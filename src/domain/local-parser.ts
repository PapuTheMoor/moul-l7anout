import type { CaptureInput, DomainResult, ShopState, TransactionProposal } from "./types";

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "").toLowerCase().replace(/[أإآ]/g, "ا").trim();
const fail = (error: string): DomainResult<TransactionProposal> => ({ ok: false, error });
const arabicCustomers: Record<string, string> = { ahmed: "احمد", fatima: "فاطمة", youssef: "يوسف" };
const productWords: Record<string, readonly string[]> = { milk: ["حليب", "الحليب", "للحليب"], bread: ["خبز", "الخبز"], water: ["ماء", "الماء"], sugar: ["سكر", "السكر"], tea: ["شاي", "اتاي", "اتاي"] };
const quantityWords: Record<string, number> = { wa7ed: 1, wahed: 1, wahd: 1, un: 1, une: 1, واحد: 1, وحدة: 1, jouj: 2, juj: 2, deux: 2, جوج: 2, tlata: 3, trois: 3, ثلاثة: 3, rb3a: 4, quatre: 4, ربعة: 4, khmsa: 5, cinq: 5, خمسة: 5 };
const contains = (text: string, word: string) => ` ${text.replace(/[\s,;:!?]+/g, " ")} `.includes(` ${normalize(word).replace(/\s+/g, " ")} `);

function hasUnknownSaleWords(text: string, state: ShopState): boolean {
  const grammar = "khda khdat b3t b3na vendu vente achete pris a au le la les du de des et un une cash comptant especes credit kredi lcredit mazal makhlessch makhless ma khlessch خدا خذات باع بعت بالكريدي كريدي مازال ماخلصش نقدا نقد كاش".split(" ");
  const known = new Set([
    ...grammar, ...Object.keys(quantityWords), ...Object.values(arabicCustomers),
    ...state.customers.flatMap(c => [normalize(c.id), ...normalize(c.name).split(/\s+/)]),
    ...state.products.flatMap(p => [normalize(p.name), ...p.aliases.map(normalize), ...(productWords[p.id] || []).map(normalize)]),
  ]);
  return text.split(/[\s,;:!?]+/).some(word => word && !/^\d+$/.test(word) && !known.has(word));
}

function repayment(input: CaptureInput, text: string, customerId: string | undefined, state: ShopState): DomainResult<TransactionProposal> {
  if (!customerId) return fail("Précisez un client connu pour le remboursement.");
  const known = new Set(["khlles", "khless", "khelles", "a", "paye", "rembourse", "remboursement", "dirham", "dirhams", "dh", "mad", "خلص", "سدد", "درهم", "دراهم", ...Object.values(arabicCustomers), ...state.customers.flatMap(c => [normalize(c.id), ...normalize(c.name).split(/\s+/)])]);
  const unknownWords = text.split(/[\s;:!?]+/).some(word => word && !/^\d+(?:[.,]\d{1,2})?$/.test(word) && !known.has(word));
  if ((text.match(/\d+(?:[.,]\d+)?/g) || []).length !== 1 || unknownWords) return fail("Le mode exemples comprend un remboursement et un montant par phrase.");
  const amount = text.match(/(?:^|\s)(\d+(?:[.,]\d{1,2})?)(?=\s*(?:dirham|dh|mad|درهم|دراهم|$))/);
  if (!amount || /(?:^|\s)-\d/.test(text)) return fail("Précisez le montant remboursé en dirhams.");
  const amountCentimes = Math.round(Number(amount[1].replace(",", ".")) * 100);
  if (!Number.isSafeInteger(amountCentimes) || amountCentimes <= 0) return fail("Le montant du remboursement doit être positif.");
  return { ok: true, value: { id: input.id, originalInput: input.text, source: input.source, kind: "repayment", customerId, amountCentimes } };
}

export function parseLocal(input: CaptureInput, state: ShopState): DomainResult<TransactionProposal> {
  const text = normalize(input.text);
  if (!text || text.length > 1000 || !input.id) return fail("Écrivez une phrase courte pour votre carnet.");
  const creation = input.text.trim().match(/^(?:زيد|اضف|أضف|ajouter|ajoute|zid)\s+(?:(?:un|une)\s+)?(?:(?:nouveau|nouvelle)\s+)?(?:زبون(?:ة)?|عميل(?:ة)?|client(?:e)?)\s+(?:(?:جديد|جديدة)\s+)?(?:(?:سميتو|سميتها|اسمو|اسمها)\s+)?([\p{L}\p{M}][\p{L}\p{M}\s'’.-]{0,79})$/iu);
  if (creation) return { ok: true, value: { id: input.id, originalInput: input.text, source: input.source, kind: "customer", name: creation[1].trim().replace(/\s+/g, " ") } };
  const customers = state.customers.filter(c => contains(text, c.name) || contains(text, c.id) || contains(text, arabicCustomers[c.id] || c.id));
  if (customers.length > 1) return fail("Précisez un seul client par opération.");
  const customerId = customers[0]?.id;
  const credit = /makhless|ma\s*khless|mazal|credit|kredi|كريدي|ما\s*خلص/.test(text);
  if (!credit && /khlles|khless|khelles|paye|rembours|خلص|سدد/.test(text)) return repayment(input, text, customerId, state);
  const products = state.products.filter(p => [...p.aliases, p.name, ...(productWords[p.id] || [])].some(word => contains(text, word)));
  if (products.length !== 1) return fail("Le mode exemples comprend un produit connu par phrase. Essayez un exemple ou passez à OpenAI.");
  const quantities = text.split(/[\s,;:!?]+/).flatMap(word => Object.hasOwn(quantityWords, word) ? [quantityWords[word]] : /^\d+$/.test(word) ? [Number(word)] : []);
  if (quantities.length !== 1 || !Number.isSafeInteger(quantities[0]) || quantities[0] <= 0 || /\d[.,]\d/.test(text)) return fail("Précisez une quantité entière, par exemple « jouj » ou « 2 ».");
  const cash = /cash|comptant|especes|نقد|كاش/.test(text);
  if (credit && cash) return fail("Précisez si la vente est au comptant ou à crédit.");
  if (!credit && !cash) return fail("Précisez « cash » ou « mazal makhlessch ».");
  if (credit && !customerId) return fail("Précisez le nom d'un client du carnet pour le crédit.");
  if (hasUnknownSaleWords(text, state)) return fail("Cette phrase dépasse le mode exemples. Utilisez OpenAI ou un exemple proposé.");
  return { ok: true, value: { id: input.id, originalInput: input.text, source: input.source, kind: "sale", payment: credit ? "credit" : "cash", customerId: customerId || null, lines: [{ productId: products[0].id, quantity: quantities[0] }] } };
}
