import { afterEach, describe, expect, it, vi } from "vitest";
import { interpretTransaction } from "@/lib/server/interpret";
import { ApiError } from "@/lib/server/api-error";

const capture = { id: "test-1", text: "Ahmed khda jouj l7lib, mazal makhlessch", source: "typed" as const };
const extracted = { kind: "sale", payment: "credit", customerId: "ahmed", lines: [{ productId: "milk", quantity: 2 }], amountCentimes: null, clarification: null };
const response = (value: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }] }), { status: 200 });
afterEach(() => vi.unstubAllEnvs());

describe("server transaction interpretation", () => {
  it("turns a structured model result into a stamped proposal without letting the model choose IDs", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-placeholder");
    const call = vi.fn().mockResolvedValue(response(extracted));
    const result = await interpretTransaction(capture, call);
    expect(result.proposal).toEqual({ id: "test-1", originalInput: capture.text, source: "typed", kind: "sale", payment: "credit", customerId: "ahmed", lines: [{ productId: "milk", quantity: 2 }] });
    expect(result.engine).toBe("openai");
    expect(call).toHaveBeenCalledOnce();
  });
  it("rejects invalid and oversized input before calling OpenAI", async () => {
    const call = vi.fn();
    await expect(interpretTransaction({ ...capture, text: "x".repeat(1001) }, call)).rejects.toBeInstanceOf(ApiError);
    expect(call).not.toHaveBeenCalled();
  });
  it("rejects an unknown product even if returned by the model", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-placeholder");
    const call = vi.fn().mockResolvedValue(response({ ...extracted, lines: [{ productId: "invented", quantity: 1 }] }));
    await expect(interpretTransaction(capture, call)).rejects.toMatchObject({ code: "INVALID_RESULT" });
  });
  it("returns a clarification without manufacturing a purchase", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-placeholder");
    const call = vi.fn().mockResolvedValue(response({ kind: "clarification", payment: null, customerId: null, lines: [], amountCentimes: null, clarification: "Quel produit et quelle quantité ?" }));
    await expect(interpretTransaction(capture, call)).rejects.toMatchObject({ code: "CLARIFICATION", message: "Quel produit et quelle quantité ?" });
  });
  it("extracts a repayment and never treats it as a sale", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-placeholder");
    const call = vi.fn().mockResolvedValue(response({ kind: "repayment", payment: null, customerId: "ahmed", lines: [], amountCentimes: 4900, clarification: null }));
    const result = await interpretTransaction({ ...capture, text: "Ahmed khlles 49 dirham" }, call);
    expect(result.proposal).toMatchObject({ kind: "repayment", customerId: "ahmed", amountCentimes: 4900 });
  });
  it("sanitizes provider errors instead of exposing their bodies", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-placeholder");
    const call = vi.fn().mockResolvedValue(new Response("private provider detail", { status: 429 }));
    await expect(interpretTransaction(capture, call)).rejects.toMatchObject({ code: "PROVIDER_LIMIT" });
  });
  it("rejects fractional quantities and empty credit customers", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only-placeholder");
    for (const value of [{ ...extracted, lines: [{ productId: "milk", quantity: 1.5 }] }, { ...extracted, customerId: null }]) {
      await expect(interpretTransaction(capture, vi.fn().mockResolvedValue(response(value)))).rejects.toMatchObject({ code: "INVALID_RESULT" });
    }
  });
});
