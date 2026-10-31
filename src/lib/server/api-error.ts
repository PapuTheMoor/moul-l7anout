export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(error: unknown): Response {
  const known = error instanceof ApiError;
  return Response.json({ success: false, error: {
    code: known ? error.code : "INTERNAL_ERROR",
    message: known ? error.message : "Une erreur est survenue. Réessayez ou utilisez les exemples locaux.",
  } }, { status: known ? error.status : 500, headers: { "Cache-Control": "no-store" } });
}
