import { afterEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_SHOP } from "@/data/seed";
import { interpretInput } from "@/lib/client-api";

const input = { id: "client-test", text: "زيد زبون جديد سميتو سعيد", source: "typed" as const };
const reply = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
afterEach(() => vi.unstubAllGlobals());

describe("interpretation client", () => {
  it("sends the live snapshot, draft and locale and validates a new customer", async () => {
    const proposal = { ...input, kind: "customer", name: "سعيد", originalInput: input.text };
    const validProposal = { id: proposal.id, kind: proposal.kind, name: proposal.name, originalInput: proposal.originalInput, source: proposal.source };
    const fetchMock = vi.fn().mockResolvedValue(reply({ proposal: validProposal }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await interpretInput(input, SAMPLE_SHOP, new AbortController().signal, null, "ar");
    expect(result).toEqual({ type: "proposal", proposal: validProposal });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ customers: SAMPLE_SHOP.customers, draft: null, locale: "ar" });
  });
  it("validates command names and does not accept arbitrary actions", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({ command: "confirm" })).mockResolvedValueOnce(reply({ command: "run_shell" }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await interpretInput(input, SAMPLE_SHOP, new AbortController().signal)).toEqual({ type: "command", command: "confirm" });
    await expect(interpretInput(input, SAMPLE_SHOP, new AbortController().signal)).rejects.toThrow();
  });
});
