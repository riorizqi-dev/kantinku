import type { AppState, CartItem, User } from "./types";
import {
  createInitialState,
  DEFAULT_USERS,
  DEFAULT_SELLERS,
  DEFAULT_PRODUCTS,
} from "./seed";
import {
  formatVariantLabel,
  getVariantImage,
  normalizeProduct,
  normalizeProducts,
} from "./product";
import type { Product } from "./types";

/**
 * Lengkapi foto varian dari seed jika data lama belum punya image per varian.
 * Tidak menimpa foto yang sudah di-set penjual (data:image / custom).
 */
function enrichVariantImagesFromSeed(products: Product[]): Product[] {
  const seedById = new Map(DEFAULT_PRODUCTS.map((p) => [p.id, p]));
  return products.map((p) => {
    const seed = seedById.get(p.id);
    if (!seed) return p;

    const variants = p.variants.map((v) => {
      if (v.image?.trim()) return v;
      const seedVar = seed.variants.find((sv) => sv.id === v.id);
      if (seedVar?.image) return { ...v, image: seedVar.image };
      return v;
    });

    return {
      ...p,
      image: p.image?.trim() ? p.image : seed.image,
      variants,
    };
  });
}

/** v3 = produk + varian. Migrasi dari v2/v1. */
const STORAGE_KEY = "kantinku_v3";
const LEGACY_KEYS = ["kantinku_v2", "kantinku_v1"] as const;

/** Username demo lama — dibuang saat migrasi gerai */
const OBSOLETE_SELLER_USERNAMES = new Set([
  "warungsari",
  "baksojaya",
  "esminum",
  "snackbox",
  "nasiwarung",
  "penjual",
]);

/** Pastikan akun seed selalu sinkron (username/password/nama) */
function mergeDefaultUsers(users: User[]): User[] {
  const byId = new Map(users.map((u) => [u.id, u]));

  for (const def of DEFAULT_USERS) {
    const existing = byId.get(def.id);
    byId.set(def.id, {
      ...existing,
      ...def,
      // pertahankan avatar yang sudah di-upload
      avatar: existing?.avatar || def.avatar,
      createdAt: existing?.createdAt || def.createdAt,
    });
  }

  const seedIds = new Set(DEFAULT_USERS.map((u) => u.id));
  return Array.from(byId.values()).filter((u) => {
    if (seedIds.has(u.id)) return true;
    if (OBSOLETE_SELLER_USERNAMES.has(u.username.toLowerCase())) return false;
    return true;
  });
}

/** Force 5 gerai seed: nama, booth, rating reset (0) */
function mergeDefaultSellers(
  sellers: AppState["sellers"]
): AppState["sellers"] {
  const others = sellers.filter(
    (s) => !DEFAULT_SELLERS.some((d) => d.id === s.id)
  );
  const merged = DEFAULT_SELLERS.map((def) => {
    const existing = sellers.find((s) => s.id === def.id);
    return {
      ...def,
      phone: existing?.phone ?? def.phone,
      createdAt: existing?.createdAt || def.createdAt,
      // selalu fresh: rating & nama gerai dari seed
      name: def.name,
      booth: def.booth,
      description: def.description || existing?.description || "",
      rating: 0,
      reviewCount: 0,
      ratingSum: 0,
      isActive: true,
    };
  });
  return [...merged, ...others];
}

function migrateCart(raw: unknown, products: AppState["products"]): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];

  for (const item of raw as Partial<CartItem>[]) {
    const productId = String(item.productId || "");
    const product = products.find((p) => p.id === productId);
    if (!product) continue;

    let variantId = item.variantId ? String(item.variantId) : "";
    let variant = product.variants.find((v) => v.id === variantId);

    // Cart lama tanpa variantId → ambil varian pertama yang masih stok / pertama
    if (!variant) {
      variant =
        product.variants.find((v) => v.stock > 0) || product.variants[0];
      variantId = variant?.id || "";
    }
    if (!variant || !variantId) continue;

    const productName = product.name;
    const variantName = variant.name;
    out.push({
      productId,
      variantId,
      sellerId: product.sellerId,
      productName,
      variantName,
      name:
        item.name ||
        formatVariantLabel(productName, variantName),
      price: Number(item.price ?? variant.price) || variant.price,
      image: item.image || getVariantImage(product, variant),
      qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
    });
  }

  return out;
}

function readLegacyRaw(): string | null {
  if (typeof window === "undefined") return null;
  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) return raw;
  }
  return null;
}

export function loadState(): AppState {
  if (typeof window === "undefined") return createInitialState();
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let fromLegacy = false;

    if (!raw) {
      const legacy = readLegacyRaw();
      if (legacy) {
        raw = legacy;
        fromLegacy = true;
      } else {
        const initial = createInitialState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
    }

    const parsed = JSON.parse(raw) as Partial<AppState> & {
      products?: unknown[];
      cart?: unknown[];
    };
    const base = createInitialState();

    const sellers =
      parsed.sellers && parsed.sellers.length >= 5
        ? mergeDefaultSellers(parsed.sellers)
        : DEFAULT_SELLERS;

    // Produk: normalisasi ke struktur varian; seed baru jika kosong / seller belum multi
    let products =
      parsed.products &&
      parsed.products.length > 0 &&
      parsed.sellers &&
      parsed.sellers.length >= 5
        ? normalizeProducts(parsed.products)
        : DEFAULT_PRODUCTS.map((p) => normalizeProduct(p));

    // Fresh multi-variant seed if migrated data still looks like flat single-item catalog
    // (no multi-variant products) after upgrade from old demo — prefer demo richness
    const hasMultiVariant = products.some((p) => p.variants.length > 1);
    if (fromLegacy && !hasMultiVariant) {
      products = DEFAULT_PRODUCTS.map((p) => normalizeProduct(p));
    }

    // Isi foto varian dari seed jika belum ada (demo + data lama)
    products = enrichVariantImagesFromSeed(products);

    const cart = migrateCart(parsed.cart ?? [], products);

    const settings = { ...base.settings, ...parsed.settings };
    // Branding sekolah default
    if (
      !settings.schoolName ||
      settings.schoolName === "KantinKu" ||
      /school canteen/i.test(settings.schoolName)
    ) {
      settings.schoolName = "SMK Negeri 17";
    }

    // Hapus rating di pesanan lama (fresh ulasan)
    const orders = (parsed.orders ?? []).map((o) => ({
      ...o,
      rating: undefined,
      ratingComment: undefined,
      ratedAt: undefined,
      items: (o.items || []).map((it) => ({
        productId: it.productId,
        variantId: it.variantId || `${it.productId}_default`,
        name: it.name,
        productName: it.productName,
        variantName: it.variantName,
        price: it.price,
        qty: it.qty,
        image: it.image,
      })),
    }));

    const state: AppState = {
      ...base,
      ...parsed,
      settings,
      cart,
      session: parsed.session ?? null,
      users: mergeDefaultUsers(
        parsed.users?.length ? parsed.users : base.users
      ),
      sellers,
      products,
      orders,
      orderSeq: parsed.orderSeq ?? 0,
      // selalu reset ulasan lokal ke kosong saat load (fresh)
      reviews: [],
    };

    // Persist v3 setelah migrasi
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  const initial = createInitialState();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  }
  return initial;
}
