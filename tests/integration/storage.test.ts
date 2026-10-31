import { describe, expect, it, vi } from "vitest";
import { SAMPLE_SHOP } from "@/data/seed";
import { loadShop, saveShop, STORAGE_KEY } from "@/lib/storage";

describe("browser ledger persistence", () => {
  it("roundtrips only validated shop state", () => {
    let stored: string | null = null;
    const storage = { getItem: () => stored, setItem: (_key: string, value: string) => { stored = value; }, removeItem: vi.fn() };
    expect(loadShop(storage)).toEqual({ ok: true, value: null });
    expect(saveShop(storage, SAMPLE_SHOP).ok).toBe(true);
    expect(loadShop(storage)).toEqual({ ok: true, value: SAMPLE_SHOP });
    expect(STORAGE_KEY).toBe("moul7anout.shop.v1");
  });
  it("does not silently reset corrupted or tampered data", () => {
    const storage = { getItem: () => '{"version":1,"products":[]}', setItem: vi.fn(), removeItem: vi.fn() };
    expect(loadShop(storage).ok).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it("reports storage denial without throwing", () => {
    const storage = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); }, removeItem: vi.fn() };
    expect(loadShop(storage).ok).toBe(false);
    expect(saveShop(storage, SAMPLE_SHOP).ok).toBe(false);
  });
});
