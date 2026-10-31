import { describe, expect, it } from "vitest";
import { parseVoiceCommand } from "@/lib/voice-commands";

describe("explicit voice actions", () => {
  it.each([
    ["أكد", "confirm"], ["سجل العملية", "confirm"], ["confirmer", "confirm"],
    ["إلغاء", "cancel"], ["annuler", "cancel"], ["تراجع", "undo"], ["رجع آخر عملية", "undo"],
    ["مسح الدفتر", "reset"], ["réinitialiser le carnet", "reset"],
    ["وريني الزبناء", "show_customers"], ["وريني السلع", "show_products"],
    ["وريني العمليات", "show_activity"], ["رجع للبداية", "show_capture"],
    ["هضر بالفرنسية", "language_fr"], ["بدل للعربية", "language_ar"],
    ["mode local", "engine_local"], ["mode openai", "engine_openai"],
  ] as const)("recognizes %s as %s", (text, command) => {
    expect(parseVoiceCommand(text)).toBe(command);
  });

  it.each(["أحمد خلص 20 درهم", "زيد زبون سارة", "سجل عملية بيع أحمد", "لا تؤكد", "", "yes but do not confirm"])("does not treat a transaction or ambiguous sentence as a command: %s", (text) => {
    expect(parseVoiceCommand(text)).toBeNull();
  });
});
