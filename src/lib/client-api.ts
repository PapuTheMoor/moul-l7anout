import type { CaptureInput, Interpretation, ShopState, TransactionProposal, VoiceCommand } from "@/domain/types";
import { validateProposal } from "@/domain/validation";

async function payload(response: Response): Promise<Record<string, unknown>> {
  const raw: unknown = await response.json();
  if (!raw || typeof raw !== "object" || !("success" in raw)) throw new Error("Réponse inattendue du serveur. Réessayez.");
  const value = raw as Record<string, unknown>;
  if (!response.ok || value.success !== true) {
    const error = value.error;
    throw new Error(error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : "Le service ne répond pas. Utilisez les exemples locaux.");
  }
  if (!value.data || typeof value.data !== "object") throw new Error("La réponse est incomplète. Réessayez.");
  return value.data as Record<string, unknown>;
}

const commands: readonly VoiceCommand[] = ["confirm", "cancel", "undo", "reset", "show_customers", "show_products", "show_activity", "show_capture", "language_ar", "language_fr", "engine_local", "engine_openai"];

export async function interpretInput(input: CaptureInput, state: ShopState, signal: AbortSignal, draft?: TransactionProposal | null, locale: "ar" | "fr" = "fr"): Promise<Interpretation> {
  const response = await fetch("/api/interpret", {
    method: "POST", headers: { "Content-Type": "application/json" }, signal,
    body: JSON.stringify({ ...input, customers: state.customers, draft: draft ?? null, locale }),
  });
  const data = await payload(response);
  if (typeof data.command === "string" && commands.includes(data.command as VoiceCommand)) return { type: "command", command: data.command as VoiceCommand };
  const proposal = validateProposal(data.proposal);
  if (!proposal.ok || proposal.value.id !== input.id) throw new Error("L'opération reçue est invalide. Reformulez votre phrase.");
  return { type: "proposal", proposal: proposal.value };
}

export async function transcribeAudio(audio: Blob, signal: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, audio.type.includes("mp4") ? "enregistrement.m4a" : "enregistrement.webm");
  const data = await payload(await fetch("/api/transcribe", { method: "POST", body: form, signal }));
  if (typeof data.text !== "string" || !data.text.trim() || data.text.length > 1000) throw new Error("La transcription est vide. Essayez la saisie texte.");
  return data.text;
}
