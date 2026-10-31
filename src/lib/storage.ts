import type { DomainResult, ShopState } from "@/domain/types";
import { validateShopState } from "@/domain/validation";

export const STORAGE_KEY = "moul7anout.shop.v1";
type ShopStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadShop(storage: ShopStorage): DomainResult<ShopState | null> {
  let raw: string | null;
  try { raw = storage.getItem(STORAGE_KEY); }
  catch { return { ok: false, error: "Stockage local indisponible : le carnet fonctionne uniquement pour cette session." }; }
  if (raw === null) return { ok: true, value: null };
  try {
    const parsed = validateShopState(JSON.parse(raw));
    return parsed.ok ? parsed : { ok: false, error: "Le carnet sauvegardé est invalide. Réinitialisez-le pour reprendre sans écraser des données inconnues." };
  } catch { return { ok: false, error: "Le carnet sauvegardé est illisible. Réinitialisez-le pour reprendre." }; }
}

export function saveShop(storage: ShopStorage, state: ShopState): DomainResult<void> {
  const valid = validateShopState(state);
  if (!valid.ok) return { ok: false, error: "Le carnet n'a pas pu être validé pour la sauvegarde." };
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return { ok: true, value: undefined }; }
  catch { return { ok: false, error: "Sauvegarde locale indisponible. Cette opération reste dans la session : ne fermez pas cet onglet." }; }
}
