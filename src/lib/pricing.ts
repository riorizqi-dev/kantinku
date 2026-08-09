import type { Product } from "./types";
import { getActiveVariants, getProductMinPrice } from "./product";

/** Bulatkan harga ke kelipatan 500 terdekat (min. 1000) — pas untuk harga jajanan */
export function roundPrice(n: number): number {
  if (n <= 0) return 0;
  return Math.max(1000, Math.ceil(n / 500) * 500);
}

/**
 * Saran harga jual berdasarkan modal (HPP) + margin target.
 * marginPercent dalam persen (mis. 30 = target untung 30% dari harga jual).
 * harga jual = modal / (1 - margin/100), dibulatkan ke 500.
 */
export function suggestPriceFromCost(
  cost: number,
  marginPercent: number
): number {
  const costN = Number(cost) || 0;
  const margin = Math.min(Math.max(Number(marginPercent) || 0, 0), 90);
  if (costN <= 0) return 0;
  const price = costN / (1 - margin / 100);
  return roundPrice(price);
}

/** Median harga termurah produk dalam satu kategori (referensi pasar) */
export function marketMedianPrice(
  products: Product[],
  category: Product["category"]
): number {
  const prices = products
    .filter((p) => p.isActive && p.category === category)
    .map((p) => getProductMinPrice(p))
    .filter((n) => n > 0);
  if (!prices.length) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** Estimasi laba per unit dari harga jual & modal */
export function profitPerUnit(price: number, cost: number): number {
  return Math.max(0, (Number(price) || 0) - (Number(cost) || 0));
}

/** Margin aktual (%) dari harga jual & modal */
export function actualMarginPercent(price: number, cost: number): number {
  const p = Number(price) || 0;
  const c = Number(cost) || 0;
  if (p <= 0) return 0;
  return Math.round(((p - c) / p) * 100);
}

export function fmtMoney(n: number): string {
  return Number(n || 0).toLocaleString("id-ID");
}

/** Referensi varian termurah lain agar saran tetap kompetitif */
export function getActiveVariantCount(product: Product): number {
  return getActiveVariants(product).length;
}
