import { ApiError } from "./api-error";

export type ProviderFetch = typeof fetch;

export function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY || process.env.Agents_API_API_key;
  if (!key) throw new ApiError("MISSING_KEY", "La clé OpenAI manque côté serveur. Le mode exemples locaux reste disponible.", 503);
  return key;
}

export async function callOpenAI(path: string, body: BodyInit, contentType?: string, call: ProviderFetch = fetch) {
  const key = getOpenAIKey();
  let response: Response;
  try {
    response = await call(`https://api.openai.com/v1/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, ...(contentType ? { "Content-Type": contentType } : {}) },
      body,
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("PROVIDER_UNAVAILABLE", "OpenAI ne répond pas à temps. Réessayez ou passez aux exemples locaux.", 503);
  }
  if (response.status === 429) throw new ApiError("PROVIDER_LIMIT", "Le quota OpenAI est temporairement indisponible. Réessayez plus tard ou utilisez les exemples locaux.", 429);
  if (response.status === 401 || response.status === 403) throw new ApiError("PROVIDER_ACCESS", "La clé ne donne pas accès à cette fonction OpenAI. Utilisez les exemples locaux.", 503);
  if (!response.ok) throw new ApiError("PROVIDER_UNAVAILABLE", "Le service OpenAI est indisponible. Votre carnet n'a pas été modifié.", 503);
  try { return await response.json(); }
  catch { throw new ApiError("INVALID_RESULT", "La réponse OpenAI est illisible. Réessayez avec une phrase plus courte.", 502); }
}
