"use client";

import { ShopWorkspace } from "@/components/shop-workspace";
import { useShop } from "@/lib/use-shop";

export default function Home() {
  const shop = useShop();
  return <ShopWorkspace {...shop} />;
}
