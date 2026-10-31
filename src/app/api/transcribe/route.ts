import { ApiError, errorResponse } from "@/lib/server/api-error";
import { callOpenAI } from "@/lib/server/openai";
import { enforceRequestSafety, readBoundedBody } from "@/lib/server/request-safety";

export const runtime = "nodejs";
const AUDIO_LIMIT = 10 * 1024 * 1024;
const extensions: Record<string, string> = {
  "audio/webm": "webm", "video/webm": "webm", "audio/mp4": "m4a", "audio/mpeg": "mp3",
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg",
};

export async function POST(request: Request) {
  try {
    enforceRequestSafety(request);
    const type = request.headers.get("content-type") || "";
    if (!type.startsWith("multipart/form-data")) throw new ApiError("INVALID_AUDIO", "Envoyez un enregistrement audio.");
    const bytes = await readBoundedBody(request, AUDIO_LIMIT + 16_384);
    const form = await new Response(bytes as BodyInit, { headers: { "Content-Type": type } }).formData();
    const file = form.get("audio");
    if (!(file instanceof File) || file.size === 0 || file.size > AUDIO_LIMIT) throw new ApiError("INVALID_AUDIO", "L'enregistrement doit faire moins de 10 Mo.");
    const mime = file.type.split(";")[0];
    const extension = extensions[mime];
    if (!extension) throw new ApiError("INVALID_AUDIO", "Ce format audio n'est pas pris en charge. Utilisez la saisie texte.");
    const upload = new FormData();
    upload.append("file", file, `enregistrement.${extension}`);
    upload.append("model", process.env.OPENAI_AUDIO_MODEL || "gpt-transcribe");
    upload.append("prompt", "Moroccan Darija shop: Ahmed, Fatima, Youssef, l7lib, khobz, lma, sokkar, atay. Preserve the spoken amounts and names.");
    const result = await callOpenAI("audio/transcriptions", upload);
    if (typeof result.text !== "string" || !result.text.trim() || result.text.length > 1000) throw new ApiError("INVALID_AUDIO", "La transcription est vide ou trop longue. Réessayez avec une phrase courte.", 422);
    return Response.json({ success: true, data: { text: result.text.trim() } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
