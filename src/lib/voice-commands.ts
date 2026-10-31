import type { VoiceCommand } from "@/domain/types";

function normalize(text: string): string {
  return text.normalize("NFKD").toLowerCase()
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[.,!?؟،؛:؛!]/g, " ")
    .replace(/\s+/g, " ").trim();
}

const commands: ReadonlyArray<readonly [VoiceCommand, readonly string[]]> = [
  ["confirm", ["أكد", "أكد العملية", "تأكيد", "سجل", "سجل العملية", "صادق", "confirmer", "confirme", "valider", "sajjel", "sjel", "نعم"]],
  ["cancel", ["إلغاء", "ألغي", "لغي", "لا", "annuler", "cancel", "لغاء العملية"]],
  ["undo", ["تراجع", "تراجع عن آخر عملية", "رجع آخر عملية", "رجع العملية الأخيرة", "annuler la dernière opération", "undo"]],
  ["reset", ["مسح الدفتر", "مسح الكناش", "حيد جميع البيانات", "réinitialiser le carnet", "effacer le carnet"]],
  ["show_customers", ["وريني الزبناء", "حل الزبناء", "افتح الزبناء", "carnet clients", "afficher les clients"]],
  ["show_products", ["وريني السلع", "وريني المنتجات", "حل السلع", "afficher les produits"]],
  ["show_activity", ["وريني العمليات", "وريني النشاط", "afficher les opérations", "historique"]],
  ["show_capture", ["رجع للبداية", "حل الرئيسية", "afficher l'accueil", "accueil"]],
  ["language_ar", ["بدل للعربية", "بالدارجة", "هضر بالدارجة", "هضر بالعربية", "arabic", "العربية"]],
  ["language_fr", ["هضر بالفرنسية", "بدل للفرنسية", "بالفرنسية", "français", "en français"]],
  ["engine_local", ["mode local", "الأمثلة المحلية", "الوضع المحلي"]],
  ["engine_openai", ["mode openai", "الذكاء الاصطناعي", "وضع الذكاء الاصطناعي"]],
];

/** Accept only complete, explicit commands; ordinary transactions must reach the interpreter. */
export function parseVoiceCommand(text: string): VoiceCommand | null {
  const input = normalize(text);
  if (!input) return null;
  return commands.find(([, aliases]) => aliases.some((alias) => normalize(alias) === input))?.[0] ?? null;
}
