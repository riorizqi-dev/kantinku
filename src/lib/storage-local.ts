import type {
  AutoPayoutConfig,
  CartItem,
  SellerReview,
  SessionUser,
} from "./types";

/** session + ulasan lapak + pengaturan pencairan otomatis di browser */
const LOCAL_KEY = "kantinku_local_v1";
/** cart per-owner (guest atau id akun). Per device: tiap device punya map-nya sendiri. */
const CARTS_KEY = "kantinku_carts_v2";

export type LocalSlice = {
  session: SessionUser | null;
  reviews: SellerReview[];
  autoPayouts: Record<string, AutoPayoutConfig>;
};

/** Pemilik cart: "guest" kalau belum login, atau id akun kalau sudah login. */
export function ownerKey(session: SessionUser | null): string {
  return session ? session.id : "guest";
}

function loadCartsMap(): Record<string, CartItem[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CARTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CartItem[]>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

/** Cart milik satu owner (guest atau akun). Akun baru belum punya → [] */
export function loadCartFor(owner: string): CartItem[] {
  const map = loadCartsMap();
  const cart = map[owner];
  return Array.isArray(cart) ? cart : [];
}

export function saveCartFor(owner: string, cart: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    const map = loadCartsMap();
    map[owner] = cart;
    localStorage.setItem(CARTS_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

/** Sekali saja: pindah cart lama (kantinku_local_v1.cart) ke pemiliknya. */
function migrateLegacyCart(session: SessionUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(CARTS_KEY)) return;
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<LocalSlice> & {
      cart?: CartItem[];
    };
    const legacyCart = Array.isArray(parsed.cart) ? parsed.cart : [];
    if (!legacyCart.length) return;
    const owner = session ? session.id : "guest";
    saveCartFor(owner, legacyCart);
  } catch {
    /* ignore */
  }
}

export function loadLocalSlice(): LocalSlice {
  if (typeof window === "undefined") {
    return { session: null, reviews: [], autoPayouts: {} };
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { session: null, reviews: [], autoPayouts: {} };
    const parsed = JSON.parse(raw) as Partial<LocalSlice> & {
      cart?: CartItem[];
    };
    const session = parsed.session ?? null;
    migrateLegacyCart(session);
    return {
      session,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      autoPayouts: parsed.autoPayouts ?? {},
    };
  } catch {
    return { session: null, reviews: [], autoPayouts: {} };
  }
}

export function saveLocalSlice(slice: LocalSlice) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({
        session: slice.session,
        reviews: slice.reviews,
        autoPayouts: slice.autoPayouts,
      })
    );
  } catch {
    /* quota / private mode */
  }
}