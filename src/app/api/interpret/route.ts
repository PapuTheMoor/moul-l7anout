import { ApiError, errorResponse } from "@/lib/server/api-error";
import { interpretTransaction } from "@/lib/server/interpret";
import { enforceRequestSafety, readBoundedBody } from "@/lib/server/request-safety";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceRequestSafety(request);
    const bytes = await readBoundedBody(request, 16_384);
    let body: unknown;
    try { body = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { throw new ApiError("INVALID_INPUT", "Le format de la demande est invalide."); }
    const data = await interpretTransaction(body);
    return Response.json({ success: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
