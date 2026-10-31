import { ApiError } from "./api-error";

export function createRateLimiter(limit = 20, windowMs = 60_000, clock = Date.now) {
  let timestamps: number[] = [];
  return () => {
    const now = clock();
    timestamps = timestamps.filter((time) => now - time < windowMs);
    if (timestamps.length >= limit) return false;
    timestamps = [...timestamps, now];
    return true;
  };
}

const allowRequest = createRateLimiter();

export function enforceRequestSafety(request: Request, allow = allowRequest): void {
  const origin = request.headers.get("origin");
  const target = new URL(request.url);
  const host = request.headers.get("host");
  if (host) target.host = host;
  if ((origin && origin !== target.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError("INVALID_ORIGIN", "Origine de la requête non autorisée.", 403);
  }
  if (!allow()) throw new ApiError("RATE_LIMIT", "Trop de demandes. Patientez une minute avant de réessayer.", 429);
}

export async function readBoundedBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > maxBytes) {
    throw new ApiError("TOO_LARGE", "Le fichier ou le texte dépasse la taille autorisée.", 413);
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  let chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new ApiError("TOO_LARGE", "Le fichier ou le texte dépasse la taille autorisée.", 413);
      }
      chunks = [...chunks, value];
    }
  } finally { reader.releaseLock(); }
  return new Uint8Array(Buffer.concat(chunks));
}
