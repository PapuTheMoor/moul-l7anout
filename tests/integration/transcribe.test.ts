import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/transcribe/route";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

function audioRequest(type: string, bytes = "test-audio") {
  const form = new FormData();
  form.append("audio", new File([bytes], "sample.webm", { type }));
  return new Request("http://localhost:3000/api/transcribe", { method: "POST", body: form });
}

describe("audio API route", () => {
  it("rejects non-audio uploads before contacting the provider", async () => {
    const provider = vi.spyOn(globalThis, "fetch");
    const response = await POST(audioRequest("text/plain"));
    expect(response.status).toBe(400);
    expect(provider).not.toHaveBeenCalled();
  });
  it("returns a bounded transcript from a valid provider response", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-placeholder");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ text: "أحمد خدا جوج الحليب" }), { status: 200 }));
    const response = await POST(audioRequest("audio/webm"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { text: "أحمد خدا جوج الحليب" } });
  });
  it("handles empty transcripts without inventing speech", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-placeholder");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ text: "" }), { status: 200 }));
    const response = await POST(audioRequest("audio/webm"));
    expect(response.status).toBe(422);
  });
});
