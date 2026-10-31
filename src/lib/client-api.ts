import type { CaptureInput, ShopState, TransactionProposal } from "@/domain/types";
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

export async function interpretInput(input: CaptureInput, state: ShopState, signal: AbortSignal): Promise<TransactionProposal> {
  const response = await fetch("/api/interpret", {
    method: "POST", headers: { "Content-Type": "application/json" }, signal,
    body: JSON.stringify({ ...input, balances: Object.fromEntries(state.customers.map((c) => [c.id, c.balanceCentimes])) }),
  });
  const data = await payload(response);
  const proposal = validateProposal(data.proposal);
  if (!proposal.ok || proposal.value.id !== input.id) throw new Error("L'opération reçue est invalide. Reformulez votre phrase.");
  return proposal.value;
}

export async function transcribeAudio(audio: Blob, signal: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, audio.type.includes("mp4") ? "enregistrement.m4a" : "enregistrement.webm");
  const data = await payload(await fetch("/api/transcribe", { method: "POST", body: form, signal }));
  if (typeof data.text !== "string" || !data.text.trim() || data.text.length > 1000) throw new Error("La transcription est vide. Essayez la saisie texte.");
  return data.text;
}
