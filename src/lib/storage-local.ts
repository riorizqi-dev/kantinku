import type {
  AutoPayoutConfig,
  CartItem,
  SellerReview,
  SessionUser,
} from "./types";

/** cart + session + ulasan lapak + pengaturan pencairan otomatis di browser */
const LOCAL_KEY = "kantinku_local_v1";

export type LocalSlice = {
  cart: CartItem[];
  session: SessionUser | null;
  reviews: SellerReview[];
  autoPayouts: Record<string, AutoPayoutConfig>;
};

export function loadLocalSlice(): LocalSlice {
  if (typeof window === "undefined") {
    return { cart: [], session: null, reviews: [], autoPayouts: {} };
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { cart: [], session: null, reviews: [], autoPayouts: {} };
    const parsed = JSON.parse(raw) as Partial<LocalSlice>;
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      session: parsed.session ?? null,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      autoPayouts: parsed.autoPayouts ?? {},
    };
  } catch {
    return { cart: [], session: null, reviews: [], autoPayouts: {} };
  }
}

export function saveLocalSlice(slice: LocalSlice) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(slice));
  } catch {
    /* quota / private mode */
  }
}
