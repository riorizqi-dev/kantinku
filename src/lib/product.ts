import type { CartItem, Product, ProductVariant } from "./types";
import { uid } from "./utils";

/** Varian yang aktif (default: true jika field kosong) */
export function getActiveVariants(product: Product): ProductVariant[] {
  return (product.variants || []).filter((v) => v.isActive !== false);
}

export function findVariant(
  product: Product | undefined,
  variantId: string | undefined
): ProductVariant | undefined {
  if (!product || !variantId) return undefined;
  return product.variants?.find((v) => v.id === variantId);
}

/** Stok total semua varian aktif */
export function getProductTotalStock(product: Product): number {
  return getActiveVariants(product).reduce((n, v) => n + Math.max(0, v.stock), 0);
}

export function isProductOutOfStock(product: Product): boolean {
  return getProductTotalStock(product) <= 0;
}

/** Harga terendah di antara varian aktif (0 jika kosong) */
export function getProductMinPrice(product: Product): number {
  const vars = getActiveVariants(product);
  if (!vars.length) return 0;
  return Math.min(...vars.map((v) => v.price));
}

export function getProductMaxPrice(product: Product): number {
  const vars = getActiveVariants(product);
  if (!vars.length) return 0;
  return Math.max(...vars.map((v) => v.price));
}

/** True jika ada rentang harga (lebih dari satu harga berbeda) */
export function hasPriceRange(product: Product): boolean {
  const vars = getActiveVariants(product);
  if (vars.length < 2) return false;
  const min = Math.min(...vars.map((v) => v.price));
  const max = Math.max(...vars.map((v) => v.price));
  return min !== max;
}

export function getVariantImage(
  product: Product,
  variant?: ProductVariant | null
): string {
  const vImg = variant?.image?.trim();
  if (vImg) return vImg;
  return product.image || "";
}

/** Label keranjang / pesanan */
export function formatVariantLabel(
  productName: string,
  variantName: string
): string {
  const p = productName.trim();
  const v = variantName.trim();
  if (!v || v.toLowerCase() === p.toLowerCase()) return p;
  return `${p} · ${v}`;
}

export function cartItemKey(productId: string, variantId: string): string {
  return `${productId}::${variantId}`;
}

export function sameCartLine(
  a: Pick<CartItem, "productId" | "variantId">,
  productId: string,
  variantId: string
): boolean {
  return a.productId === productId && a.variantId === variantId;
}

/**
 * Normalisasi produk lama (price/stock di root) → struktur variants.
 * Aman dipanggil berulang.
 */
export function normalizeProduct(raw: unknown): Product {
  const p = raw as Partial<Product> & {
    price?: number;
    stock?: number;
    variants?: Partial<ProductVariant>[];
  };

  const id = String(p.id || uid("prod"));
  const name = String(p.name || "Produk");
  const image = String(p.image || "");

  let variants: ProductVariant[] = [];

  if (Array.isArray(p.variants) && p.variants.length > 0) {
    variants = p.variants.map((v, i) => ({
      id: String(v.id || `${id}_var_${i + 1}`),
      name: String(v.name || name).trim() || name,
      price: Math.max(0, Number(v.price) || 0),
      stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
      image: v.image ? String(v.image) : undefined,
      isActive: v.isActive !== false,
    }));
  } else {
    // Legacy flat product
    variants = [
      {
        id: `${id}_default`,
        name,
        price: Math.max(0, Number(p.price) || 0),
        stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
        isActive: true,
      },
    ];
  }

  return {
    id,
    sellerId: String(p.sellerId || ""),
    name,
    category: (p.category as Product["category"]) || "Makanan",
    description: String(p.description || ""),
    image,
    isActive: p.isActive !== false,
    createdAt: Number(p.createdAt) || Date.now(),
    updatedAt: p.updatedAt,
    variants,
  };
}

export function normalizeProducts(list: unknown[]): Product[] {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeProduct);
}

/** Kurangi stok varian; return products baru atau null jika gagal */
export function deductVariantStock(
  products: Product[],
  productId: string,
  variantId: string,
  qty: number
): Product[] | null {
  const product = products.find((p) => p.id === productId);
  const variant = findVariant(product, variantId);
  if (!product || !variant || variant.stock < qty) return null;

  return products.map((p) => {
    if (p.id !== productId) return p;
    return {
      ...p,
      variants: p.variants.map((v) =>
        v.id === variantId
          ? { ...v, stock: Math.max(0, v.stock - qty) }
          : v
      ),
    };
  });
}

export function restoreVariantStock(
  products: Product[],
  productId: string,
  variantId: string,
  qty: number
): Product[] {
  return products.map((p) => {
    if (p.id !== productId) return p;
    return {
      ...p,
      variants: p.variants.map((v) =>
        v.id === variantId ? { ...v, stock: v.stock + qty } : v
      ),
    };
  });
}
