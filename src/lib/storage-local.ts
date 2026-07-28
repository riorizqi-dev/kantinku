import type { CartItem, SellerReview, SessionUser } from "./types";

/** cart + session + ulasan lapak di browser */
const LOCAL_KEY = "kantinku_local_v1";

export type LocalSlice = {
  cart: CartItem[];
  session: SessionUser | null;
  reviews: SellerReview[];
};

export function loadLocalSlice(): LocalSlice {
  if (typeof window === "undefined") {
    return { cart: [], session: null, reviews: [] };
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { cart: [], session: null, reviews: [] };
    const parsed = JSON.parse(raw) as Partial<LocalSlice>;
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      session: parsed.session ?? null,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    };
  } catch {
    return { cart: [], session: null, reviews: [] };
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
