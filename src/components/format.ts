export function money(centimes: number): string {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(centimes / 100)} DH`;
}

export function initials(name: string): string {
  return name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}
