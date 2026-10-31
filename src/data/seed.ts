import type { ShopState } from "@/domain/types";

/** Synthetic workshop data, not real shop prices or customer records. */
export const SAMPLE_SHOP: ShopState = {
  version: 1,
  products: [
    { id: "milk", name: "Lait", aliases: ["l7lib", "7lib", "lait"], priceCentimes: 700, stock: 24 },
    { id: "bread", name: "Pain", aliases: ["khobz", "pain"], priceCentimes: 150, stock: 40 },
    { id: "water", name: "Eau", aliases: ["lma", "ma", "eau"], priceCentimes: 600, stock: 18 },
    { id: "sugar", name: "Sucre", aliases: ["sokkar", "sucre"], priceCentimes: 1400, stock: 12 },
    { id: "tea", name: "Thé", aliases: ["atay", "the"], priceCentimes: 1800, stock: 10 },
  ],
  customers: [
    { id: "ahmed", name: "Ahmed", balanceCentimes: 3500 },
    { id: "fatima", name: "Fatima", balanceCentimes: 2000 },
    { id: "youssef", name: "Youssef", balanceCentimes: 0 },
  ],
  transactions: [],
};

export const SAMPLE_PHRASES = [
  "Ahmed khda jouj l7lib, mazal makhlessch",
  "B3t jouj khobz cash",
  "Ahmed khlles 49 dirham",
] as const;
