import type {
  AppState,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  PlatformSettings,
  Product,
  ProductCategory,
  ProductVariant,
  Seller,
  User,
  UserRole,
  CheckoutPaymentMethod,
  CheckoutPickupMethod,
  WithdrawalRequest,
  WithdrawalMethod,
  WithdrawalStatus,
  WithdrawalFeeType,
  SalesReport,
  SalesReportItem,
  SalesReportStatus,
} from "@/lib/types";

/* ---------- DB row shapes (snake_case) ---------- */

export type DbSeller = {
  id: string;
  name: string;
  owner_user_id: string | null;
  phone: string;
  booth: string | null;
  is_active: boolean;
  rating: number | null;
  review_count: number;
  rating_sum: number;
  created_at: string;
  is_open: boolean;
  delivery_fee: number;
};

export type DbUser = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  nis: string | null;
  kelas: string | null;
  phone: string | null;
  seller_id: string | null;
  avatar: string | null;
  is_active: boolean;
  created_at: string;
};

export type DbProduct = {
  id: string;
  seller_id: string;
  name: string;
  category: ProductCategory;
  description: string;
  image: string;
  is_active: boolean;
  can_deliver: boolean;
  created_at: string;
  updated_at: string | null;
};

export type DbVariant = {
  id: string;
  product_id: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  is_active: boolean;
};

export type DbSettings = {
  id: number;
  school_name: string;
  commission_rate: number;
  platform_whatsapp: string;
  order_seq: number;
  withdrawal_fee_type: WithdrawalFeeType;
  withdrawal_fee_value: number;
  menu_categories: unknown;
  announcements: unknown;
  operating_hours: unknown;
  enabled_payment_methods: unknown;
  activity_log: unknown;
  updated_at: string;
};

export type DbOrder = {
  id: string;
  order_number: string;
  seller_id: string;
  seller_name: string;
  seller_avatar: string | null;
  buyer_id: string | null;
  buyer_name: string;
  buyer_class: string;
  buyer_phone: string;
  buyer_avatar: string | null;
  subtotal: number;
  commission_rate: number;
  commission_amount: number;
  seller_amount: number;
  total: number;
  payment_fee: number;
  notes: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: CheckoutPaymentMethod | null;
  pickup_method: CheckoutPickupMethod | null;
  delivery_fee: number;
  bayar_invoice_id: string | null;
  bayar_payment_url: string | null;
  paid_at: string | null;
  stock_restored: boolean;
  seen_by_seller: boolean;
  rating: number | null;
  rating_comment: string | null;
  rated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbOrderItem = {
  id?: number;
  order_id: string;
  product_id: string;
  variant_id: string;
  name: string;
  product_name: string | null;
  variant_name: string | null;
  price: number;
  qty: number;
  image: string;
};

export type DbWithdrawal = {
  id: string;
  seller_id: string;
  seller_name: string;
  amount: number;
  fee: number;
  net_amount: number;
  method: WithdrawalMethod;
  account_number: string;
  account_name: string;
  status: WithdrawalStatus;
  reject_reason: string | null;
  processed_by: string | null;
  created_at: string;
  processed_at: string | null;
};

export type DbSalesReport = {
  id: string;
  seller_id: string;
  seller_name: string;
  booth: string | null;
  report_date: string;
  items: unknown;
  total_revenue: number;
  notes: string | null;
  status: SalesReportStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string | null;
};

function ts(ms?: number | null): string | null {
  if (ms == null) return null;
  return new Date(ms).toISOString();
}

function ms(iso?: string | null): number {
  if (!iso) return Date.now();
  const n = Date.parse(iso);
  return Number.isFinite(n) ? n : Date.now();
}

export function sellerToDb(s: Seller): DbSeller {
  return {
    id: s.id,
    name: s.name,
    owner_user_id: s.ownerUserId || null,
    phone: s.phone || "",
    booth: s.booth || null,
    is_active: s.isActive !== false,
    rating: s.rating ?? null,
    review_count: s.reviewCount ?? 0,
    rating_sum: s.ratingSum ?? 0,
    created_at: ts(s.createdAt) || new Date().toISOString(),
    is_open: s.isOpen !== false,
    delivery_fee: s.deliveryFee || 0,
  };
}

export function sellerFromDb(r: DbSeller): Seller {
  return {
    id: r.id,
    name: r.name,
    ownerUserId: r.owner_user_id || "",
    phone: r.phone || "",
    booth: r.booth || undefined,
    isActive: r.is_active,
    rating: r.rating ?? undefined,
    reviewCount: r.review_count,
    ratingSum: r.rating_sum,
    createdAt: ms(r.created_at),
    isOpen: r.is_open !== false,
    deliveryFee: r.delivery_fee || 0,
  };
}

export function userToDb(u: User): DbUser {
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    name: u.name,
    role: u.role,
    nis: u.nis || null,
    kelas: u.kelas || null,
    phone: u.phone || null,
    seller_id: u.sellerId || null,
    avatar: u.avatar || null,
    is_active: u.isActive !== false,
    created_at: ts(u.createdAt) || new Date().toISOString(),
  };
}

export function userFromDb(r: DbUser): User {
  return {
    id: r.id,
    username: r.username,
    password: r.password,
    name: r.name,
    role: r.role,
    nis: r.nis || undefined,
    kelas: r.kelas || undefined,
    phone: r.phone || undefined,
    sellerId: r.seller_id || undefined,
    avatar: r.avatar || undefined,
    isActive: r.is_active !== false,
    createdAt: ms(r.created_at),
  };
}

export function productToDb(p: Product): DbProduct {
  return {
    id: p.id,
    seller_id: p.sellerId,
    name: p.name,
    category: p.category,
    description: p.description || "",
    image: p.image || "",
    is_active: p.isActive !== false,
    can_deliver: p.canDeliver === true,
    created_at: ts(p.createdAt) || new Date().toISOString(),
    updated_at: ts(p.updatedAt),
  };
}

export function variantToDb(v: ProductVariant, productId: string): DbVariant {
  return {
    id: v.id,
    product_id: productId,
    name: v.name,
    price: Math.round(v.price),
    stock: Math.max(0, Math.floor(v.stock)),
    image: v.image || null,
    is_active: v.isActive !== false,
  };
}

export function productFromDb(
  p: DbProduct,
  variants: DbVariant[]
): Product {
  return {
    id: p.id,
    sellerId: p.seller_id,
    name: p.name,
    category: p.category,
    description: p.description || "",
    image: p.image || "",
    isActive: p.is_active,
    canDeliver: p.can_deliver === true,
    createdAt: ms(p.created_at),
    updatedAt: p.updated_at ? ms(p.updated_at) : undefined,
    variants: variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      stock: v.stock,
      image: v.image || undefined,
      isActive: v.is_active,
    })),
  };
}

export function settingsToDb(
  s: PlatformSettings,
  orderSeq: number
): DbSettings {
  return {
    id: 1,
    school_name: s.schoolName,
    commission_rate: s.commissionRate,
    platform_whatsapp: s.platformWhatsapp || "",
    order_seq: orderSeq,
    withdrawal_fee_type: s.withdrawalFeeType || "percent",
    withdrawal_fee_value: s.withdrawalFeeValue ?? 3,
    menu_categories: s.menuCategories?.length ? s.menuCategories : ["Makanan", "Minuman", "Snack"],
    announcements: s.announcements ?? [],
    operating_hours: s.operatingHours ?? { enabled: false, openTime: "06:30", closeTime: "16:00" },
    enabled_payment_methods: s.enabledPaymentMethods?.length
      ? s.enabledPaymentMethods
      : ["online", "canteen"],
    activity_log: s.activityLog ?? [],
    updated_at: new Date().toISOString(),
  };
}

export function settingsFromDb(r: DbSettings): {
  settings: PlatformSettings;
  orderSeq: number;
} {
  return {
    settings: {
      schoolName: r.school_name,
      commissionRate: Number(r.commission_rate),
      platformWhatsapp: r.platform_whatsapp || "",
      withdrawalFeeType: (r.withdrawal_fee_type as WithdrawalFeeType) || "percent",
      withdrawalFeeValue: Number(r.withdrawal_fee_value) || 3,
      menuCategories: Array.isArray(r.menu_categories) && r.menu_categories.length
        ? (r.menu_categories as string[])
        : ["Makanan", "Minuman", "Snack"],
      announcements: Array.isArray(r.announcements)
        ? (r.announcements as PlatformSettings["announcements"])
        : [],
      operatingHours:
        r.operating_hours && typeof r.operating_hours === "object"
          ? { enabled: false, openTime: "06:30", closeTime: "16:00", ...(r.operating_hours as Record<string, unknown>) }
          : { enabled: false, openTime: "06:30", closeTime: "16:00" },
      enabledPaymentMethods: Array.isArray(r.enabled_payment_methods) &&
        (r.enabled_payment_methods as string[]).length
        ? (r.enabled_payment_methods as PlatformSettings["enabledPaymentMethods"])
        : ["online", "canteen"],
      activityLog: Array.isArray(r.activity_log)
        ? (r.activity_log as PlatformSettings["activityLog"])
        : [],
    },
    orderSeq: r.order_seq || 0,
  };
}

export function orderToDb(o: Order): DbOrder {
  return {
    id: o.id,
    order_number: o.orderNumber,
    seller_id: o.sellerId,
    seller_name: o.sellerName,
    seller_avatar: o.sellerAvatar || null,
    buyer_id: o.buyerId,
    buyer_name: o.buyerName,
    buyer_class: o.buyerClass,
    buyer_phone: o.buyerPhone,
    buyer_avatar: o.buyerAvatar || null,
    subtotal: o.subtotal,
    commission_rate: o.commissionRate,
    commission_amount: o.commissionAmount,
    seller_amount: o.sellerAmount,
    total: o.total,
    payment_fee: o.paymentFee || 0,
    notes: o.notes || null,
    status: o.status,
    payment_status: o.paymentStatus,
    payment_method: o.paymentMethod || null,
    pickup_method: o.pickupMethod || null,
    delivery_fee: o.deliveryFee || 0,
    bayar_invoice_id: o.bayarInvoiceId || null,
    bayar_payment_url: o.bayarPaymentUrl || null,
    paid_at: ts(o.paidAt),
    stock_restored: Boolean(o.stockRestored),
    seen_by_seller: Boolean(o.seenBySeller),
    rating: o.rating ?? null,
    rating_comment: o.ratingComment || null,
    rated_at: ts(o.ratedAt),
    created_at: ts(o.createdAt) || new Date().toISOString(),
    updated_at: ts(o.updatedAt) || new Date().toISOString(),
  };
}

export function orderItemToDb(it: OrderItem, orderId: string): DbOrderItem {
  return {
    order_id: orderId,
    product_id: it.productId,
    variant_id: it.variantId,
    name: it.name,
    product_name: it.productName || null,
    variant_name: it.variantName || null,
    price: it.price,
    qty: it.qty,
    image: it.image || "",
  };
}

export function orderFromDb(o: DbOrder, items: DbOrderItem[]): Order {
  return {
    id: o.id,
    orderNumber: o.order_number,
    sellerId: o.seller_id,
    sellerName: o.seller_name,
    sellerAvatar: o.seller_avatar || undefined,
    buyerId: o.buyer_id,
    buyerName: o.buyer_name,
    buyerClass: o.buyer_class,
    buyerPhone: o.buyer_phone,
    buyerAvatar: o.buyer_avatar || undefined,
    items: items.map((it) => ({
      productId: it.product_id,
      variantId: it.variant_id,
      name: it.name,
      productName: it.product_name || undefined,
      variantName: it.variant_name || undefined,
      price: it.price,
      qty: it.qty,
      image: it.image || "",
    })),
    subtotal: o.subtotal,
    commissionRate: Number(o.commission_rate),
    commissionAmount: o.commission_amount,
    sellerAmount: o.seller_amount,
    total: o.total,
    paymentFee: o.payment_fee || 0,
    notes: o.notes || undefined,
    status: o.status,
    paymentStatus: o.payment_status,
    paymentMethod: o.payment_method || undefined,
    pickupMethod: o.pickup_method || undefined,
    deliveryFee: o.delivery_fee || 0,
    bayarInvoiceId: o.bayar_invoice_id || undefined,
    bayarPaymentUrl: o.bayar_payment_url || undefined,
    paidAt: o.paid_at ? ms(o.paid_at) : undefined,
    stockRestored: o.stock_restored,
    seenBySeller: o.seen_by_seller,
    rating: o.rating ?? undefined,
    ratingComment: o.rating_comment || undefined,
    ratedAt: o.rated_at ? ms(o.rated_at) : undefined,
    createdAt: ms(o.created_at),
    updatedAt: ms(o.updated_at),
  };
}

export function withdrawalToDb(w: WithdrawalRequest): DbWithdrawal {
  return {
    id: w.id,
    seller_id: w.sellerId,
    seller_name: w.sellerName,
    amount: w.amount,
    fee: w.fee,
    net_amount: w.netAmount,
    method: w.method,
    account_number: w.accountNumber,
    account_name: w.accountName,
    status: w.status,
    reject_reason: w.rejectReason || null,
    processed_by: w.processedBy || null,
    created_at: ts(w.createdAt) || new Date().toISOString(),
    processed_at: ts(w.processedAt),
  };
}

export function withdrawalFromDb(r: DbWithdrawal): WithdrawalRequest {
  return {
    id: r.id,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    amount: r.amount,
    fee: r.fee,
    netAmount: r.net_amount,
    method: r.method,
    accountNumber: r.account_number,
    accountName: r.account_name,
    status: r.status,
    rejectReason: r.reject_reason || undefined,
    processedBy: r.processed_by || undefined,
    createdAt: ms(r.created_at),
    processedAt: r.processed_at ? ms(r.processed_at) : undefined,
  };
}

export function salesReportToDb(r: SalesReport): DbSalesReport {
  return {
    id: r.id,
    seller_id: r.sellerId,
    seller_name: r.sellerName,
    booth: r.booth || null,
    report_date: r.date,
    items: (r.items || []) as unknown,
    total_revenue: Math.round(r.totalRevenue || 0),
    notes: r.notes || null,
    status: r.status || "submitted",
    verified_by: r.verifiedBy || null,
    verified_at: ts(r.verifiedAt),
    created_at: ts(r.createdAt) || new Date().toISOString(),
    updated_at: ts(r.updatedAt),
  };
}

export function salesReportFromDb(r: DbSalesReport): SalesReport {
  return {
    id: r.id,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    booth: r.booth || undefined,
    date: r.report_date,
    items: Array.isArray(r.items)
      ? (r.items as SalesReportItem[])
      : [],
    totalRevenue: r.total_revenue,
    notes: r.notes || undefined,
    status: r.status || "submitted",
    verifiedBy: r.verified_by || undefined,
    verifiedAt: r.verified_at ? ms(r.verified_at) : undefined,
    createdAt: ms(r.created_at),
    updatedAt: r.updated_at ? ms(r.updated_at) : undefined,
  };
}

export type RemoteBundle = Pick<
  AppState,
  | "users"
  | "sellers"
  | "products"
  | "orders"
  | "settings"
  | "orderSeq"
  | "withdrawals"
  | "salesReports"
>;
