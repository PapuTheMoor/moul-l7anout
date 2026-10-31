import { describe, expect, it } from "vitest";
import { createRateLimiter, enforceRequestSafety, readBoundedBody } from "@/lib/server/request-safety";

describe("local API boundaries", () => {
  it("rejects cross-origin browser requests", () => {
    const req = new Request("http://localhost:3000/api/interpret", { method: "POST", headers: { origin: "https://unrelated.test" } });
    expect(() => enforceRequestSafety(req, () => true)).toThrow("Origine");
  });
  it("accepts same-origin requests and rejects exhausted rate limits", () => {
    const req = new Request("http://localhost:3000/api/interpret", { method: "POST", headers: { origin: "http://localhost:3000" } });
    expect(() => enforceRequestSafety(req, () => true)).not.toThrow();
    expect(() => enforceRequestSafety(req, () => false)).toThrow("Trop");
  });
  it("uses the public Host header when Next normalizes the internal URL", () => {
    const req = new Request("http://localhost:3000/api/interpret", { method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } });
    expect(() => enforceRequestSafety(req, () => true)).not.toThrow();
  });
  it("resets a bounded request window", () => {
    let now = 1000;
    const allow = createRateLimiter(2, 100, () => now);
    expect([allow(), allow(), allow()]).toEqual([true, true, false]);
    now = 1101;
    expect(allow()).toBe(true);
  });
  it("rejects bodies larger than the real streamed-byte cap", async () => {
    const req = new Request("http://localhost:3000", { method: "POST", body: "too large" });
    await expect(readBoundedBody(req, 3)).rejects.toMatchObject({ status: 413 });
  });
  it("accepts a small body exactly", async () => {
    const req = new Request("http://localhost:3000", { method: "POST", body: "ok" });
    expect(new TextDecoder().decode(await readBoundedBody(req, 3))).toBe("ok");
  });
});
