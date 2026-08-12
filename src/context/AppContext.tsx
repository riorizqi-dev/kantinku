"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AppState,
  AutoPayoutConfig,
  CartItem,
  CheckoutPaymentMethod,
  CheckoutPickupMethod,
  Order,
  OrderStatus,
  PaymentStatus,
  PlatformSettings,
  Product,
  ProductCategory,
  ProductVariant,
  Seller,
  SellerReview,
  SessionUser,
  User,
  UserRole,
  WithdrawalRequest,
  WithdrawalMethod,
} from "@/lib/types";
import { createInitialState, DEFAULT_SELLERS } from "@/lib/seed";
import { loadState, resetState, saveState } from "@/lib/storage";
import {
  loadCartFor,
  loadLocalSlice,
  ownerKey,
  saveCartFor,
  saveLocalSlice,
} from "@/lib/storage-local";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  loadRemoteBundle,
  seedIfEmpty,
  syncBundleToSupabase,
} from "@/lib/supabase/repo";
import { calcCommission, uid } from "@/lib/utils";
import {
  deductVariantStock,
  findVariant,
  formatVariantLabel,
  getVariantImage,
  restoreVariantStock,
  sameCartLine,
} from "@/lib/product";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface AppContextValue {
  ready: boolean;
  state: AppState;
  toasts: ToastItem[];
  toast: (message: string, type?: ToastItem["type"]) => void;
  dismissToast: (id: string) => void;
  // Auth
  login: (username: string, password: string) => UserRole | null;
  register: (data: {
    name: string;
    username: string;
    password: string;
    kelas: string;
    phone?: string;
  }) => string | null;
  logout: () => void;
  // Cart — line = productId + variantId
  addToCart: (productId: string, variantId: string, qty?: number) => void;
  updateCartQty: (productId: string, variantId: string, delta: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  // Orders
  createPendingOrder: (payload: {
    buyerName: string;
    buyerClass: string;
    buyerPhone: string;
    notes?: string;
    paymentMethod?: CheckoutPaymentMethod;
    pickupMethod?: CheckoutPickupMethod;
  }) => Promise<Order | null>;
  /** Tandai pesanan COD sudah dibayar di kantin */
  markCanteenPaid: (orderId: string) => void;
  markOrderPaid: (orderId: string, bayarInvoiceId?: string) => void;
  markOrderPaidByInvoice: (invoiceId: string) => boolean;
  attachBayarPayment: (
    orderId: string,
    invoiceId: string,
    paymentUrl: string,
    paymentFee?: number
  ) => void;
  markOrderPaymentStatus: (
    orderId: string,
    paymentStatus: PaymentStatus
  ) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  /** Customer rating toko setelah pesanan completed (1× per order) */
  rateOrder: (
    orderId: string,
    stars: number,
    comment?: string
  ) => string | null;
  /** Ulasan langsung ke lapak (dari profil lapak di menu) */
  addSellerReview: (
    sellerId: string,
    stars: number,
    comment: string,
    buyerName?: string
  ) => string | null;
  markOrdersSeen: (sellerId: string) => void;
  getSellerUnreadCount: (sellerId: string) => number;
  // Products (+ variants)
  saveProduct: (
    data: {
      name: string;
      category: ProductCategory;
      description?: string;
      image: string;
      sellerId: string;
      variants: ProductVariant[];
      isActive?: boolean;
      canDeliver?: boolean;
    },
    id?: string
  ) => void;
  deleteProduct: (id: string) => void;
  // Settings / admin
  updateSettings: (patch: Partial<PlatformSettings>) => void;
  updateSeller: (
    id: string,
    patch: Partial<Seller>,
    opts?: { silent?: boolean }
  ) => void;
  addSellerUser: (data: {
    name: string;
    username: string;
    password: string;
    sellerName: string;
    phone?: string;
  }) => string | null;
  addAdminUser: (data: {
    name: string;
    username: string;
    password: string;
    phone?: string;
  }) => string | null;
  /** Update profil (nama + avatar) user yang sedang login */
  updateProfile: (data: {
    name: string;
    avatar?: string;
    phone?: string;
    kelas?: string;
  }) => string | null;
  resetAllData: () => void;
  // Pencairan
  /** Hitung saldo tersedia penjual (computed dari orders) */
  getSellerBalance: (sellerId: string) => number;
  /** Request pencairan oleh penjual */
  requestWithdrawal: (data: {
    sellerId: string;
    amount: number;
    method: WithdrawalMethod;
    accountNumber: string;
    accountName: string;
  }) => string | null;
  /** Approve / Reject oleh admin */
  processWithdrawal: (
    withdrawalId: string,
    action: "approved" | "rejected",
    rejectReason?: string
  ) => void;
  /** Tandai selesai (admin sudah transfer) */
  completeWithdrawal: (withdrawalId: string) => void;
  /** Aktifkan / matikan pencairan otomatis untuk penjual */
  setAutoPayout: (
    sellerId: string,
    config: AutoPayoutConfig | null
  ) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Seed dulu biar UI tidak blank; hydrate Supabase / localStorage setelah mount
  const [state, setState] = useState<AppState>(createInitialState);
  const [ready, setReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [useRemote, setUseRemote] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = loadLocalSlice();

      // 1) Coba Supabase
      if (isSupabaseConfigured()) {
        try {
          await seedIfEmpty(false);
          const remote = await loadRemoteBundle();
          if (!cancelled && remote && remote.sellers.length > 0) {
            // Sinkron 5 gerai seed (nama/login/rating fresh dari seed.ts)
            const seedIds = new Set(DEFAULT_SELLERS.map((d) => d.id));
            const sellers = [
              ...DEFAULT_SELLERS.map((def) => {
                const remoteS = remote.sellers.find((s) => s.id === def.id);
                return {
                  ...def,
                  phone: remoteS?.phone ?? def.phone,
                  createdAt: remoteS?.createdAt || def.createdAt,
                  rating: remoteS?.rating ?? 0,
                  reviewCount: remoteS?.reviewCount ?? 0,
                  ratingSum: remoteS?.ratingSum ?? 0,
                  description:
                    def.description || remoteS?.description || "",
                };
              }),
              ...remote.sellers.filter((s) => !seedIds.has(s.id)),
            ];
            // Merge users seed (username/password gerai)
            const seedUserIds = new Set(
              createInitialState().users.map((u) => u.id)
            );
            const baseUsers = createInitialState().users;
            const users = [
              ...baseUsers.map((def) => {
                const remoteU = remote.users.find((u) => u.id === def.id);
                return {
                  ...def,
                  avatar: remoteU?.avatar || def.avatar,
                  phone: remoteU?.phone ?? def.phone,
                };
              }),
              ...remote.users.filter((u) => !seedUserIds.has(u.id)),
            ];
            // Jika rating gerai di DB masih 0 semua → anggap fresh, kosongkan ulasan lokal
            const ratingsFresh = sellers
              .filter((s) => seedIds.has(s.id))
              .every((s) => (s.reviewCount || 0) === 0);
            setState({
              ...createInitialState(),
              ...remote,
              sellers,
              users,
              cart: loadCartFor(ownerKey(local.session)),
              session: local.session,
              reviews: ratingsFresh ? [] : local.reviews || [],
              autoPayouts: local.autoPayouts || {},
            });
            setUseRemote(true);
            setHydrated(true);
            setReady(true);
            return;
          }
        } catch (err) {
          console.warn("[hydrate] Supabase gagal, fallback localStorage", err);
        }
      }

      // 2) Fallback localStorage v3
      if (!cancelled) {
        const legacy = loadState();
        const savedSession = local.session ?? legacy.session;
        setState({
          ...legacy,
          reviews: legacy.reviews?.length
            ? legacy.reviews
            : local.reviews,
          // prefer session/cart per-owner dari slice baru kalau ada
          cart: loadCartFor(ownerKey(savedSession)),
          session: savedSession,
          autoPayouts: local.autoPayouts || legacy.autoPayouts || {},
        });
        setUseRemote(false);
        setHydrated(true);
        setReady(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist cart + session + reviews + autoPayouts di browser
  useEffect(() => {
    if (!hydrated) return;
    const owner = ownerKey(state.session);
    saveCartFor(owner, state.cart);
    saveLocalSlice({
      session: state.session,
      reviews: state.reviews || [],
      autoPayouts: state.autoPayouts || {},
    });
  }, [state.cart, state.session, state.reviews, state.autoPayouts, hydrated]);

  // Sync entity ke Supabase (debounced) ATAU full localStorage fallback
  useEffect(() => {
    if (!hydrated) return;

    if (!useRemote) {
      saveState(state);
      return;
    }

    const t = setTimeout(() => {
      void syncBundleToSupabase({
        sellers: state.sellers,
        users: state.users,
        products: state.products,
        orders: state.orders,
        settings: state.settings,
        orderSeq: state.orderSeq,
        withdrawals: state.withdrawals,
      }).catch((err) => {
        console.warn("[supabase sync]", err);
      });
    }, 600);

    return () => clearTimeout(t);
  }, [
    hydrated,
    useRemote,
    state.sellers,
    state.users,
    state.products,
    state.orders,
    state.settings,
    state.orderSeq,
    state.withdrawals,
  ]);

  const toast = useCallback(
    (message: string, type: ToastItem["type"] = "success") => {
      const id = uid("toast");
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 3400);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const login = useCallback(
    (username: string, password: string): UserRole | null => {
      const user = state.users.find(
        (u) =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          u.password === password.trim()
      );
      if (!user) {
        toast("Username atau password salah", "error");
        return null;
      }
      const session: SessionUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        kelas: user.kelas,
        phone: user.phone,
        sellerId: user.sellerId,
        avatar: user.avatar,
      };
      setState((s) => ({
        ...s,
        session,
        // Cart per akun: ganti ke milik akun yang login, bukan cart guest/user lain
        cart: loadCartFor(user.id),
      }));
      toast(`Selamat datang, ${user.name}`);
      return user.role;
    },
    [state.users, toast]
  );

  const register = useCallback(
    (data: {
      name: string;
      username: string;
      password: string;
      kelas: string;
      phone?: string;
    }) => {
      const username = data.username.trim().toLowerCase();
      if (state.users.some((u) => u.username.toLowerCase() === username)) {
        return "Username sudah digunakan";
      }
      if (!/^[a-z0-9_]{3,24}$/.test(username)) {
        return "Username: 3-24 karakter (huruf, angka, underscore)";
      }
      if (data.password.length < 6) return "Password minimal 6 karakter";

      const user: User = {
        id: uid("user"),
        username,
        password: data.password,
        name: data.name.trim(),
        role: "buyer",
        kelas: data.kelas.trim(),
        phone: data.phone?.trim() || "",
        createdAt: Date.now(),
      };

      const session: SessionUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        kelas: user.kelas,
        phone: user.phone,
        avatar: user.avatar,
      };

      setState((s) => ({
        ...s,
        users: [...s.users, user],
        session,
        // Akun baru → mulai dari keranjang kosong
        cart: [],
      }));
      return null;
    },
    [state.users]
  );

  const updateProfile = useCallback(
    (data: {
      name: string;
      avatar?: string;
      phone?: string;
      kelas?: string;
    }) => {
      const session = state.session;
      if (!session) return "Belum login";
      const name = data.name.trim();
      if (name.length < 2) return "Nama minimal 2 karakter";
      if (data.avatar && !data.avatar.startsWith("data:image") && data.avatar !== "") {
        return "Format foto tidak valid";
      }

      setState((s) => {
        const users = s.users.map((u) => {
          if (u.id !== session.id) return u;
          return {
            ...u,
            name,
            avatar:
              data.avatar === undefined
                ? u.avatar
                : data.avatar || undefined,
            phone:
              data.phone !== undefined ? data.phone.trim() : u.phone,
            kelas:
              data.kelas !== undefined ? data.kelas.trim() : u.kelas,
          };
        });
        const me = users.find((u) => u.id === session.id)!;
        const nextSession: SessionUser = {
          ...session,
          name: me.name,
          avatar: me.avatar,
          phone: me.phone,
          kelas: me.kelas,
        };
        return { ...s, users, session: nextSession };
      });
      toast("Profil disimpan");
      return null;
    },
    [state.session, toast]
  );

  const logout = useCallback(() => {
    setState((s) => {
      // Simpan cart akun yang keluar, lalu kembali ke cart guest
      saveCartFor(ownerKey(s.session), s.cart);
      return { ...s, session: null, cart: loadCartFor("guest") };
    });
    toast("Anda telah keluar", "info");
  }, [toast]);

  const addToCart = useCallback(
    (productId: string, variantId: string, qty = 1) => {
      const product = state.products.find((p) => p.id === productId);
      if (!product || !product.isActive) {
        toast("Produk tidak tersedia", "error");
        return;
      }
      const variant = findVariant(product, variantId);
      if (!variant || variant.isActive === false) {
        toast("Varian tidak tersedia", "error");
        return;
      }
      if (variant.stock <= 0) {
        toast("Stok habis", "error");
        return;
      }

      // Guard: tidak boleh menambah ke keranjang dari kantin yang tutup
      const seller = state.sellers.find((s) => s.id === product.sellerId);
      if (!seller) {
        toast("Kantin tidak ditemukan", "error");
        return;
      }
      if (seller.isOpen === false) {
        toast("Kantin sedang tutup. Coba lagi nanti.", "error");
        return;
      }
      const cartSellerId = state.cart[0]?.sellerId;
      const cartSeller = cartSellerId
        ? state.sellers.find((s) => s.id === cartSellerId)
        : null;
      if (cartSeller?.isOpen === false) {
        toast("Keranjang berisi item dari kantin yang tutup. Kosongkan dulu.", "warning");
        return;
      }

      const addQty = Math.max(1, Math.floor(qty));
      const cart = state.cart;
      const existing = cart.find((c) =>
        sameCartLine(c, productId, variantId)
      );
      if (existing) {
        if (existing.qty >= variant.stock) {
          toast("Jumlah melebihi stok", "warning");
          return;
        }
      } else if (cart.length && cart[0].sellerId !== product.sellerId) {
        toast("Keranjang hanya untuk satu kantin. Kosongkan dulu.", "warning");
        return;
      }

      const label = formatVariantLabel(product.name, variant.name);
      const image = getVariantImage(product, variant);

      setState((s) => {
        const next = [...s.cart];
        const ex = next.find((c) => sameCartLine(c, productId, variantId));
        if (ex) {
          ex.qty = Math.min(variant.stock, ex.qty + addQty);
        } else {
          next.push({
            productId: product.id,
            variantId: variant.id,
            sellerId: product.sellerId,
            productName: product.name,
            variantName: variant.name,
            name: label,
            price: variant.price,
            image,
            qty: Math.min(variant.stock, addQty),
          });
        }
        return { ...s, cart: next };
      });
      toast(
        addQty > 1 ? `${label} ×${addQty} ditambahkan` : `${label} ditambahkan`
      );
    },
    [state.products, state.cart, state.sellers, toast]
  );

  const updateCartQty = useCallback(
    (productId: string, variantId: string, delta: number) => {
      setState((s) => {
        const product = s.products.find((p) => p.id === productId);
        const variant = findVariant(product, variantId);
        const cart = s.cart
          .map((item) => {
            if (!sameCartLine(item, productId, variantId)) return item;
            const next = item.qty + delta;
            if (next <= 0) return null;
            if (variant && next > variant.stock) {
              toast("Stok tidak mencukupi", "warning");
              return item;
            }
            return { ...item, qty: next };
          })
          .filter(Boolean) as CartItem[];
        return { ...s, cart };
      });
    },
    [toast]
  );

  const removeFromCart = useCallback(
    (productId: string, variantId: string) => {
      setState((s) => ({
        ...s,
        cart: s.cart.filter((c) => !sameCartLine(c, productId, variantId)),
      }));
    },
    []
  );

  const clearCart = useCallback(() => {
    setState((s) => ({ ...s, cart: [] }));
  }, []);

  const cartCount = useMemo(
    () => state.cart.reduce((n, i) => n + i.qty, 0),
    [state.cart]
  );

  const cartSubtotal = useMemo(
    () => state.cart.reduce((n, i) => n + i.price * i.qty, 0),
    [state.cart]
  );

  const createPendingOrder = useCallback(
    async (payload: {
      buyerName: string;
      buyerClass: string;
      buyerPhone: string;
      notes?: string;
      paymentMethod?: CheckoutPaymentMethod;
      pickupMethod?: CheckoutPickupMethod;
    }): Promise<Order | null> => {
      if (!state.cart.length) {
        toast("Keranjang kosong", "error");
        return null;
      }

      const sellerId = state.cart[0].sellerId;
      const seller = state.sellers.find((s) => s.id === sellerId);
      if (!seller) {
        toast("Kantin tidak ditemukan", "error");
        return null;
      }
      if (seller.isOpen === false) {
        toast("Kantin sedang tutup. Pesanan belum bisa dibuat.", "error");
        return null;
      }

      const pickupMethod: CheckoutPickupMethod =
        payload.pickupMethod || "takeaway";
      // Antar ke kelas hanya jika SEMUA produk di keranjang bisa diantar
      const allCanDeliver = state.cart.every((item) => {
        const p = state.products.find((pp) => pp.id === item.productId);
        return p?.canDeliver === true;
      });
      if (pickupMethod === "delivery" && !allCanDeliver) {
        toast("Ada produk yang tidak bisa diantar ke kelas", "error");
        return null;
      }
      const deliveryFee =
        pickupMethod === "delivery" ? seller.deliveryFee || 0 : 0;

      // Validasi stok per varian
      for (const item of state.cart) {
        const product = state.products.find((p) => p.id === item.productId);
        const variant = findVariant(product, item.variantId);
        if (!product || !variant || variant.stock < item.qty) {
          toast(`Stok ${item.name} tidak cukup`, "error");
          return null;
        }
      }

      const paymentMethod: CheckoutPaymentMethod =
        payload.paymentMethod || "online";
      const isCanteen = paymentMethod === "canteen";
      const subtotal = state.cart.reduce((n, i) => n + i.price * i.qty, 0);
      const { commissionAmount, sellerAmount, total } = calcCommission(
        subtotal,
        state.settings.commissionRate
      );
      const grandTotal = total + deliveryFee;

      // Avatar pemilik lapak (user role seller)
      const sellerOwner = state.users.find(
        (u) =>
          u.sellerId === sellerId ||
          (seller && u.id === seller.ownerUserId)
      );
      // Snapshot profil customer (login) atau hanya nama form (guest)
      const buyerAvatar =
        state.session?.avatar ||
        state.users.find((u) => u.id === state.session?.id)?.avatar;

      // Jalur server: validasi ulang (gerai tutup / stok / can_deliver / harga)
      // lalu tulis order secara otoritatif. Server bilang "belum dikonfigurasi"
      // → fallback lokal (demo offline).
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId,
            buyerId: state.session?.id || null,
            buyerAvatar: buyerAvatar || null,
            buyerName: payload.buyerName.trim(),
            buyerClass: payload.buyerClass.trim(),
            buyerPhone: payload.buyerPhone.trim(),
            notes: payload.notes?.trim() || "",
            paymentMethod,
            pickupMethod,
            items: state.cart.map((c) => ({
              productId: c.productId,
              variantId: c.variantId,
              qty: c.qty,
            })),
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.order) {
          const order = data.order as Order;
          const newOrderSeq = Number(data.orderSeq ?? state.orderSeq + 1);
          setState((s) => {
            let products = s.products;
            if (isCanteen) {
              for (const item of order.items) {
                const next = deductVariantStock(
                  products,
                  item.productId,
                  item.variantId,
                  item.qty
                );
                if (next) products = next;
              }
            }
            return {
              ...s,
              orderSeq: newOrderSeq,
              orders: [order, ...s.orders],
              products,
              cart: isCanteen ? [] : s.cart,
            };
          });
          return order;
        }

        if (data?.code === "not_configured") {
          // lanjut ke fallback lokal di bawah
        } else {
          toast(
            data?.error || "Pesanan gagal dibuat. Coba lagi.",
            "error"
          );
          return null;
        }
      } catch {
        toast(
          "Tidak dapat menghubungi server. Cek koneksi lalu coba lagi.",
          "error"
        );
        return null;
      }

      // ---- Fallback lokal (demo offline tanpa supabase) ----
      const seq = state.orderSeq + 1;
      const d = new Date();
      const orderNumber = `KK-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(seq).padStart(4, "0")}`;

      const order: Order = {
        id: uid("ord"),
        orderNumber,
        sellerId,
        sellerName: seller.name || "Kantin",
        sellerAvatar: sellerOwner?.avatar,
        buyerId: state.session?.id || null,
        buyerName: payload.buyerName.trim(),
        buyerClass: payload.buyerClass.trim(),
        buyerPhone: payload.buyerPhone.trim(),
        buyerAvatar,
        items: state.cart.map((c) => ({
          productId: c.productId,
          variantId: c.variantId,
          name: c.name,
          productName: c.productName,
          variantName: c.variantName,
          price: c.price,
          qty: c.qty,
          image: c.image,
        })),
        subtotal,
        commissionRate: state.settings.commissionRate,
        commissionAmount,
        sellerAmount: sellerAmount + deliveryFee,
        total: grandTotal,
        deliveryFee,
        pickupMethod,
        notes: payload.notes?.trim() || "",
        status: "waiting",
        paymentStatus: isCanteen ? "unpaid" : "pending",
        paymentMethod,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        seenBySeller: false,
      };

      setState((s) => {
        let products = s.products;
        if (isCanteen) {
          for (const item of order.items) {
            const next = deductVariantStock(
              products,
              item.productId,
              item.variantId,
              item.qty
            );
            if (next) products = next;
          }
        }
        return {
          ...s,
          orderSeq: seq,
          orders: [order, ...s.orders],
          products,
          cart: isCanteen ? [] : s.cart,
        };
      });

      return order;
    },
    [state, toast]
  );

  const markCanteenPaid = useCallback(
    (orderId: string) => {
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: "paid" as PaymentStatus,
                paidAt: Date.now(),
                updatedAt: Date.now(),
              }
            : o
        ),
      }));
      toast("Pembayaran di kantin dicatat lunas");
    },
    [toast]
  );

  const attachBayarPayment = useCallback(
    (orderId: string, invoiceId: string, paymentUrl: string, paymentFee?: number) => {
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                bayarInvoiceId: invoiceId,
                bayarPaymentUrl: paymentUrl,
                paymentFee: paymentFee || 0,
                paymentStatus: "pending" as PaymentStatus,
                updatedAt: Date.now(),
              }
            : o
        ),
      }));
    },
    []
  );

  const markOrderPaid = useCallback(
    (orderId: string, bayarInvoiceId?: string) => {
      setState((s) => {
        const prev = s.orders.find((o) => o.id === orderId);
        if (!prev) return s;
        // Idempotent: jangan kurangi stok dua kali
        if (prev.paymentStatus === "paid") {
          return { ...s, cart: [] };
        }

        const orders = s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: "paid" as PaymentStatus,
                status: "waiting" as OrderStatus,
                paidAt: Date.now(),
                updatedAt: Date.now(),
                bayarInvoiceId: bayarInvoiceId || o.bayarInvoiceId,
                seenBySeller: false,
              }
            : o
        );

        let products = s.products;
        for (const item of prev.items) {
          const next = deductVariantStock(
            products,
            item.productId,
            item.variantId || `${item.productId}_default`,
            item.qty
          );
          if (next) products = next;
        }

        return { ...s, orders, products, cart: [] };
      });
      toast("Pembayaran berhasil. Pesanan dikirim ke kantin.");
    },
    [toast]
  );

  const markOrderPaidByInvoice = useCallback(
    (invoiceId: string) => {
      let foundId: string | null = null;
      setState((s) => {
        const prev = s.orders.find((o) => o.bayarInvoiceId === invoiceId);
        if (!prev) return s;
        foundId = prev.id;
        if (prev.paymentStatus === "paid") {
          return { ...s, cart: [] };
        }
        const orders = s.orders.map((o) =>
          o.bayarInvoiceId === invoiceId
            ? {
                ...o,
                paymentStatus: "paid" as PaymentStatus,
                status: "waiting" as OrderStatus,
                paidAt: Date.now(),
                updatedAt: Date.now(),
                seenBySeller: false,
              }
            : o
        );
        let products = s.products;
        for (const item of prev.items) {
          const next = deductVariantStock(
            products,
            item.productId,
            item.variantId || `${item.productId}_default`,
            item.qty
          );
          if (next) products = next;
        }
        return { ...s, orders, products, cart: [] };
      });
      if (foundId) {
        toast("Pembayaran berhasil. Pesanan dikirim ke kantin.");
        return true;
      }
      return false;
    },
    [toast]
  );

  const markOrderPaymentStatus = useCallback(
    (orderId: string, paymentStatus: PaymentStatus) => {
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? { ...o, paymentStatus, updatedAt: Date.now() }
            : o
        ),
      }));
    },
    []
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      // Hanya penjual yang boleh update status pesanan kantinnya
      const session = state.session;
      if (!session || session.role !== "seller" || !session.sellerId) {
        toast("Hanya penjual yang dapat mengubah status pesanan", "error");
        return;
      }

      setState((s) => {
        const target = s.orders.find((o) => o.id === orderId);
        if (!target || target.sellerId !== session.sellerId) {
          return s;
        }
        let products = s.products;
        const orders = s.orders.map((o) => {
          if (o.id !== orderId) return o;
          const next = { ...o, status, updatedAt: Date.now() };

          // Restore stok varian jika dibatalkan setelah dibayar / COD
          if (
            status === "cancelled" &&
            (o.paymentStatus === "paid" ||
              (o.paymentMethod === "canteen" &&
                o.paymentStatus !== "failed")) &&
            !o.stockRestored
          ) {
            for (const item of o.items) {
              products = restoreVariantStock(
                products,
                item.productId,
                item.variantId || `${item.productId}_default`,
                item.qty
              );
            }
            next.stockRestored = true;
          }
          return next;
        });
        return { ...s, orders, products };
      });
      toast(
        `Status pesanan: ${status === "ready" ? "Siap Diambil" : status}`
      );
    },
    [state.session, toast]
  );

  /**
   * Customer rating toko setelah pesanan completed.
   * 1× per order; update rata-rata rating Seller.
   */
  const rateOrder = useCallback(
    (orderId: string, stars: number, comment?: string): string | null => {
      const score = Math.round(Number(stars));
      if (score < 1 || score > 5) {
        return "Pilih rating 1–5 bintang";
      }

      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return "Pesanan tidak ditemukan";
      if (order.status !== "completed") {
        return "Rating hanya untuk pesanan yang sudah selesai";
      }
      if (order.rating) {
        return "Pesanan ini sudah dirating";
      }

      // Hanya buyer (login) pemilik pesanan, atau guest di perangkat (tanpa buyerId)
      const session = state.session;
      if (session?.role === "seller" || session?.role === "admin" || session?.role === "superadmin") {
        // Staff boleh rate hanya jika mereka yang jadi buyer
        if (order.buyerId && order.buyerId !== session.id) {
          return "Hanya pembeli yang dapat memberi rating";
        }
      } else if (session?.role === "buyer") {
        if (
          order.buyerId &&
          order.buyerId !== session.id &&
          order.buyerName !== session.name
        ) {
          return "Hanya pembeli yang dapat memberi rating";
        }
      }

      const note = (comment || "").trim().slice(0, 280);

      setState((s) => {
        const target = s.orders.find((o) => o.id === orderId);
        if (!target || target.rating || target.status !== "completed") {
          return s;
        }

        const orders = s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                rating: score,
                ratingComment: note || undefined,
                ratedAt: Date.now(),
                updatedAt: Date.now(),
              }
            : o
        );

        const sellers = s.sellers.map((seller) => {
          if (seller.id !== target.sellerId) return seller;
          const prevCount = seller.reviewCount ?? 0;
          const prevSum =
            seller.ratingSum ??
            (seller.rating != null && prevCount > 0
              ? seller.rating * prevCount
              : 0);
          const nextCount = prevCount + 1;
          const nextSum = prevSum + score;
          const nextAvg = Math.round((nextSum / nextCount) * 10) / 10;
          return {
            ...seller,
            rating: nextAvg,
            reviewCount: nextCount,
            ratingSum: nextSum,
          };
        });

        const review: SellerReview = {
          id: uid("rev"),
          sellerId: target.sellerId,
          buyerName: target.buyerName,
          buyerId: target.buyerId,
          stars: score,
          comment: note,
          createdAt: Date.now(),
          orderId: target.id,
        };

        return {
          ...s,
          orders,
          sellers,
          reviews: [review, ...(s.reviews || [])],
        };
      });

      toast("Terima kasih! Rating toko sudah dikirim");
      return null;
    },
    [state.orders, state.session, toast]
  );

  /**
   * Ulasan dari profil lapak (menu) — update rating aggregate + simpan review.
   */
  const addSellerReview = useCallback(
    (
      sellerId: string,
      stars: number,
      comment: string,
      buyerName?: string
    ): string | null => {
      const score = Math.round(Number(stars));
      if (score < 1 || score > 5) return "Pilih rating 1–5 bintang";
      const note = comment.trim().slice(0, 280);
      if (note.length < 3) return "Tulis komentar minimal 3 karakter";

      const seller = state.sellers.find((s) => s.id === sellerId);
      if (!seller || !seller.isActive) return "Lapak tidak ditemukan";

      const session = state.session;
      if (
        session?.role === "seller" ||
        session?.role === "admin" ||
        session?.role === "superadmin"
      ) {
        return "Akun staf tidak bisa mengulas lapak di sini";
      }

      const name =
        (buyerName || session?.name || "").trim() || "Pembeli";

      setState((s) => {
        const prevCount = seller.reviewCount ?? 0;
        const prevSum =
          seller.ratingSum ??
          (seller.rating != null && prevCount > 0
            ? seller.rating * prevCount
            : 0);
        const nextCount = prevCount + 1;
        const nextSum = prevSum + score;
        const nextAvg = Math.round((nextSum / nextCount) * 10) / 10;

        const review: SellerReview = {
          id: uid("rev"),
          sellerId,
          buyerName: name,
          buyerId: session?.id || null,
          stars: score,
          comment: note,
          createdAt: Date.now(),
        };

        return {
          ...s,
          sellers: s.sellers.map((x) =>
            x.id === sellerId
              ? {
                  ...x,
                  rating: nextAvg,
                  reviewCount: nextCount,
                  ratingSum: nextSum,
                }
              : x
          ),
          reviews: [review, ...(s.reviews || [])],
        };
      });

      toast("Terima kasih! Ulasan Anda sudah dikirim");
      return null;
    },
    [state.sellers, state.session, toast]
  );

  const markOrdersSeen = useCallback((sellerId: string) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.sellerId === sellerId &&
        (o.paymentStatus === "paid" ||
          (o.paymentMethod === "canteen" && o.paymentStatus === "unpaid"))
          ? { ...o, seenBySeller: true }
          : o
      ),
    }));
  }, []);

  const getSellerUnreadCount = useCallback(
    (sellerId: string) =>
      state.orders.filter(
        (o) =>
          o.sellerId === sellerId &&
          // Online lunas ATAU bayar di kantin (sudah masuk antrean)
          (o.paymentStatus === "paid" ||
            (o.paymentMethod === "canteen" && o.paymentStatus === "unpaid")) &&
          !o.seenBySeller &&
          o.status !== "cancelled" &&
          o.status !== "completed"
      ).length,
    [state.orders]
  );

  const saveProduct = useCallback(
    (
      data: {
        name: string;
        category: ProductCategory;
        description?: string;
        image: string;
        sellerId: string;
        variants: ProductVariant[];
        isActive?: boolean;
        canDeliver?: boolean;
      },
      id?: string
    ) => {
      const session = state.session;
      if (!session || session.role !== "seller" || !session.sellerId) {
        toast("Hanya penjual yang dapat mengelola produk", "error");
        return;
      }
      if (data.sellerId !== session.sellerId) {
        toast("Anda hanya dapat mengelola produk lapak sendiri", "error");
        return;
      }
      const image = String(data.image || "");
      if (!image.startsWith("data:image") && !image.startsWith("http")) {
        toast("Upload foto produk (gallery/kamera) wajib", "error");
        return;
      }

      const variants = (data.variants || [])
        .map((v) => ({
          id: v.id?.trim() || uid("var"),
          name: String(v.name || "").trim(),
          price: Math.max(0, Number(v.price) || 0),
          stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
          image: v.image || undefined,
          isActive: v.isActive !== false,
        }))
        .filter((v) => v.name.length > 0);

      if (!variants.length) {
        toast("Minimal 1 varian produk", "error");
        return;
      }

      setState((s) => {
        if (id) {
          const existing = s.products.find((p) => p.id === id);
          if (!existing || existing.sellerId !== session.sellerId) {
            return s;
          }
          return {
            ...s,
            products: s.products.map((p) =>
              p.id === id
                ? {
                    ...p,
                    name: data.name.trim(),
                    category: data.category,
                    description: data.description || "",
                    sellerId: session.sellerId!,
                    image,
                    variants,
                    isActive: data.isActive ?? p.isActive,
                    canDeliver: data.canDeliver ?? p.canDeliver,
                    updatedAt: Date.now(),
                  }
                : p
            ),
          };
        }
        const product: Product = {
          id: uid("prod"),
          sellerId: session.sellerId!,
          name: data.name.trim(),
          category: data.category,
          description: data.description || "",
          image,
          variants,
          isActive: data.isActive !== false,
          canDeliver: data.canDeliver === true,
          createdAt: Date.now(),
        };
        return { ...s, products: [product, ...s.products] };
      });
      toast(id ? "Produk diperbarui" : "Produk ditambahkan");
    },
    [state.session, toast]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const session = state.session;
      if (!session || session.role !== "seller" || !session.sellerId) {
        toast("Hanya penjual yang dapat menghapus produk", "error");
        return;
      }
      setState((s) => {
        const product = s.products.find((p) => p.id === id);
        if (!product || product.sellerId !== session.sellerId) {
          return s;
        }
        return {
          ...s,
          products: s.products.filter((p) => p.id !== id),
          cart: s.cart.filter((c) => c.productId !== id),
        };
      });
      toast("Produk dihapus", "info");
    },
    [state.session, toast]
  );

  const updateSettings = useCallback(
    (patch: Partial<PlatformSettings>) => {
      if (state.session?.role !== "superadmin") {
        toast(
          "Hanya Super Admin yang dapat mengubah pengaturan platform",
          "error"
        );
        return;
      }
      setState((s) => ({
        ...s,
        settings: { ...s.settings, ...patch },
      }));
      toast("Pengaturan disimpan");
    },
    [state.session, toast]
  );

  const updateSeller = useCallback(
    (id: string, patch: Partial<Seller>, opts?: { silent?: boolean }) => {
      const session = state.session;
      if (
        session?.role !== "superadmin" &&
        session?.role !== "admin" &&
        !(session?.role === "seller" && session.sellerId === id)
      ) {
        toast("Tidak punya akses mengubah data lapak", "error");
        return;
      }
      setState((s) => ({
        ...s,
        sellers: s.sellers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      }));
      if (!opts?.silent) toast("Data penjual diperbarui");
    },
    [state.session, toast]
  );

  const addSellerUser = useCallback(
    (data: {
      name: string;
      username: string;
      password: string;
      sellerName: string;
      phone?: string;
    }) => {
      if (state.session?.role !== "superadmin") {
        return "Hanya Super Admin yang dapat menambah penjual";
      }
      const username = data.username.trim().toLowerCase();
      if (state.users.some((u) => u.username.toLowerCase() === username)) {
        return "Username sudah digunakan";
      }
      const sellerId = uid("seller");
      const userId = uid("user");
      const seller: Seller = {
        id: sellerId,
        name: data.sellerName.trim(),
        ownerUserId: userId,
        phone: data.phone?.trim() || "",
        isActive: true,
        createdAt: Date.now(),
      };
      const user: User = {
        id: userId,
        username,
        password: data.password,
        name: data.name.trim(),
        role: "seller",
        sellerId,
        phone: data.phone?.trim() || "",
        createdAt: Date.now(),
      };
      setState((s) => ({
        ...s,
        sellers: [...s.sellers, seller],
        users: [...s.users, user],
      }));
      toast("Penjual baru ditambahkan");
      return null;
    },
    [state.users, state.session, toast]
  );

  const addAdminUser = useCallback(
    (data: {
      name: string;
      username: string;
      password: string;
      phone?: string;
    }) => {
      if (state.session?.role !== "superadmin") {
        return "Hanya Super Admin yang dapat menambah admin";
      }
      const username = data.username.trim().toLowerCase();
      if (state.users.some((u) => u.username.toLowerCase() === username)) {
        return "Username sudah digunakan";
      }
      if (data.password.length < 6) return "Password minimal 6 karakter";
      const user: User = {
        id: uid("user"),
        username,
        password: data.password,
        name: data.name.trim(),
        role: "admin",
        phone: data.phone?.trim() || "",
        createdAt: Date.now(),
      };
      setState((s) => ({ ...s, users: [...s.users, user] }));
      toast("Admin baru ditambahkan");
      return null;
    },
    [state.users, state.session, toast]
  );

  const resetAllData = useCallback(() => {
    if (state.session?.role !== "superadmin") {
      toast("Hanya Super Admin yang dapat reset data", "error");
      return;
    }

    void (async () => {
      if (useRemote && isSupabaseConfigured()) {
        try {
          await seedIfEmpty(true);
          const remote = await loadRemoteBundle();
          if (remote) {
            setState({
              ...createInitialState(),
              ...remote,
              cart: [],
              session: state.session,
            });
            saveCartFor(ownerKey(state.session), []);
            saveLocalSlice({
              session: state.session,
              reviews: [],
              autoPayouts: {},
            });
            toast("Data Supabase di-reset ke seed demo", "warning");
            return;
          }
        } catch (err) {
          console.warn(err);
          toast("Reset Supabase gagal, coba lokal", "error");
        }
      }
      const next = resetState();
      setState({ ...next, session: state.session, reviews: [], withdrawals: [] });
      saveCartFor(ownerKey(state.session), []);
      saveLocalSlice({
        session: state.session,
        reviews: [],
        autoPayouts: {},
      });
      toast("Data lokal dikembalikan ke awal", "warning");
    })();
  }, [state.session, toast, useRemote]);

  // ——— Pencairan ———

  const getSellerBalance = useCallback(
    (sellerId: string): number => {
      const paid = state.orders.filter(
        (o) =>
          o.sellerId === sellerId &&
          o.paymentStatus === "paid" &&
          o.status !== "cancelled"
      );
      const totalEarned = paid.reduce((n, o) => n + o.sellerAmount, 0);
      const withdrawn = state.withdrawals
        .filter(
          (w) =>
            w.sellerId === sellerId &&
            (w.status === "approved" || w.status === "completed")
        )
        .reduce((n, w) => n + w.amount, 0);
      return Math.max(0, totalEarned - withdrawn);
    },
    [state.orders, state.withdrawals]
  );

  const requestWithdrawal = useCallback(
    (data: {
      sellerId: string;
      amount: number;
      method: WithdrawalMethod;
      accountNumber: string;
      accountName: string;
    }): string | null => {
      const session = state.session;
      if (!session || session.role !== "seller" || session.sellerId !== data.sellerId) {
        return "Hanya penjual yang dapat request pencairan";
      }
      if (data.amount < 30000) {
        return "Minimal pencairan Rp 30.000";
      }
      const balance = getSellerBalance(data.sellerId);
      if (data.amount > balance) {
        return `Saldo tidak mencukupi. Tersedia: Rp ${balance.toLocaleString("id-ID")}`;
      }
      if (!data.accountNumber.trim()) {
        return "Nomor rekening / e-wallet wajib diisi";
      }
      if (!data.accountName.trim()) {
        return "Nama pemilik rekening wajib diisi";
      }

      // Hitung fee
      const { withdrawalFeeType, withdrawalFeeValue } = state.settings;
      const fee =
        withdrawalFeeType === "percent"
          ? Math.round((data.amount * withdrawalFeeValue) / 100)
          : withdrawalFeeValue;
      const netAmount = data.amount - fee;

      const seller = state.sellers.find((s) => s.id === data.sellerId);
      const withdrawal: WithdrawalRequest = {
        id: uid("wd"),
        sellerId: data.sellerId,
        sellerName: seller?.name || "Penjual",
        amount: data.amount,
        fee,
        netAmount,
        method: data.method,
        accountNumber: data.accountNumber.trim(),
        accountName: data.accountName.trim(),
        status: "pending",
        createdAt: Date.now(),
      };

      setState((s) => ({
        ...s,
        withdrawals: [withdrawal, ...s.withdrawals],
      }));
      toast("Request pencairan dikirim. Menunggu persetujuan admin.");
      return null;
    },
    [state.session, state.sellers, state.settings, getSellerBalance, toast]
  );

  const processWithdrawal = useCallback(
    (
      withdrawalId: string,
      action: "approved" | "rejected",
      rejectReason?: string
    ) => {
      const session = state.session;
      if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        toast("Hanya admin yang dapat memproses pencairan", "error");
        return;
      }

      const target = state.withdrawals.find((w) => w.id === withdrawalId);
      if (!target || target.status !== "pending") {
        toast("Request pencairan tidak valid", "error");
        return;
      }

      if (action === "rejected") {
        setState((s) => ({
          ...s,
          withdrawals: s.withdrawals.map((w) =>
            w.id === withdrawalId
              ? {
                  ...w,
                  status: "rejected" as const,
                  rejectReason: rejectReason || "Ditolak oleh admin",
                  processedBy: session.id,
                  processedAt: Date.now(),
                }
              : w
          ),
        }));
        toast("Request pencairan ditolak", "info");
        return;
      }

      // Approve — potong saldo penjual
      const balance = getSellerBalance(target.sellerId);
      if (target.amount > balance) {
        toast("Saldo penjual tidak mencukupi untuk mencairkan", "error");
        return;
      }

      setState((s) => ({
        ...s,
        withdrawals: s.withdrawals.map((w) =>
          w.id === withdrawalId
            ? {
                ...w,
                status: "approved" as const,
                processedBy: session.id,
                processedAt: Date.now(),
              }
            : w
        ),
      }));
      toast("Pencairan disetujui. Tandai selesai setelah transfer.");
    },
    [state.session, state.withdrawals, getSellerBalance, toast]
  );

  const completeWithdrawal = useCallback(
    (withdrawalId: string) => {
      const session = state.session;
      if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        toast("Hanya admin yang dapat menyelesaikan pencairan", "error");
        return;
      }

      setState((s) => ({
        ...s,
        withdrawals: s.withdrawals.map((w) =>
          w.id === withdrawalId && w.status === "approved"
            ? { ...w, status: "completed" as const, processedAt: Date.now() }
            : w
        ),
      }));
      toast("Pencairan ditandai selesai");
    },
    [state.session, toast]
  );

  const setAutoPayout = useCallback(
    (sellerId: string, config: AutoPayoutConfig | null) => {
      const session = state.session;
      if (
        !session ||
        session.role !== "seller" ||
        session.sellerId !== sellerId
      ) {
        toast("Hanya penjual yang dapat mengatur pencairan otomatis", "error");
        return;
      }
      setState((s) => {
        const autoPayouts = { ...(s.autoPayouts || {}) };
        if (!config || !config.enabled) {
          delete autoPayouts[sellerId];
        } else {
          autoPayouts[sellerId] = config;
        }
        return { ...s, autoPayouts };
      });
      toast(
        config?.enabled
          ? "Pencairan otomatis diaktifkan — saldo dicairkan otomatis saat mencapai batas"
          : "Pencairan otomatis dimatikan",
        config?.enabled ? "success" : "info"
      );
    },
    [state.session, toast]
  );

  // Pencairan otomatis: saat saldo >= threshold → langsung dibuat & diselesaikan
  // (processedBy "system" = pencairan otomatis). Converges karena saldo berkurang.
  useEffect(() => {
    if (!hydrated) return;
    const entries = Object.entries(state.autoPayouts || {}).filter(
      ([, c]) =>
        c?.enabled &&
        c.threshold > 0 &&
        c.accountNumber?.trim() &&
        c.accountName?.trim()
    );
    if (!entries.length) return;

    for (const [sellerId] of entries) {
      setState((s) => {
        const auto = s.autoPayouts?.[sellerId];
        if (!auto?.enabled) return s;
        const paid = s.orders.filter(
          (o) =>
            o.sellerId === sellerId &&
            o.paymentStatus === "paid" &&
            o.status !== "cancelled"
        );
        const earned = paid.reduce((n, o) => n + o.sellerAmount, 0);
        const withdrawn = s.withdrawals
          .filter(
            (w) =>
              w.sellerId === sellerId &&
              (w.status === "approved" || w.status === "completed")
          )
          .reduce((n, w) => n + w.amount, 0);
        const balance = Math.max(0, earned - withdrawn);
        if (balance < auto.threshold) return s;

        const amount = Math.max(
          auto.threshold,
          Math.floor(balance / 1000) * 1000
        );
        const { withdrawalFeeType, withdrawalFeeValue } = s.settings;
        const fee =
          withdrawalFeeType === "percent"
            ? Math.round((amount * withdrawalFeeValue) / 100)
            : withdrawalFeeValue;
        const netAmount = amount - fee;
        const seller = s.sellers.find((x) => x.id === sellerId);
        const withdrawal: WithdrawalRequest = {
          id: uid("wd"),
          sellerId,
          sellerName: seller?.name || "Penjual",
          amount,
          fee,
          netAmount,
          method: auto.method,
          accountNumber: auto.accountNumber.trim(),
          accountName: auto.accountName.trim(),
          status: "completed",
          processedBy: "system",
          processedAt: Date.now(),
          createdAt: Date.now(),
        };
        return { ...s, withdrawals: [withdrawal, ...s.withdrawals] };
      });
    }
  }, [state.autoPayouts, state.orders, state.withdrawals, hydrated]);

  const value: AppContextValue = {
    ready,
    state,
    toasts,
    toast,
    dismissToast,
    login,
    register,
    logout,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartCount,
    cartSubtotal,
    createPendingOrder,
    markOrderPaid,
    markOrderPaidByInvoice,
    markCanteenPaid,
    attachBayarPayment,
    markOrderPaymentStatus,
    updateOrderStatus,
    rateOrder,
    addSellerReview,
    markOrdersSeen,
    getSellerUnreadCount,
    saveProduct,
    deleteProduct,
    updateSettings,
    updateSeller,
    addSellerUser,
    addAdminUser,
    updateProfile,
    resetAllData,
    getSellerBalance,
    requestWithdrawal,
    processWithdrawal,
    completeWithdrawal,
    setAutoPayout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
