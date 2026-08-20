export type UserRole =
  | "superadmin"
  | "admin"
  | "seller"
  | "buyer"
  | "bendahara";

export type WithdrawalMethod = "bank" | "dana" | "ovo" | "gopay";

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed";

/** Tipe fee pencairan: 'percent' = persen dari jumlah, 'flat' = nominal tetap */
export type WithdrawalFeeType = "percent" | "flat";

export type ProductCategory = "Makanan" | "Minuman" | "Snack";

export type OrderStatus =
  | "waiting"
  | "processing"
  | "ready"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "expired";

/** online = QRIS online, canteen = bayar di kantin (COD) */
export type CheckoutPaymentMethod = "online" | "canteen";
/** Cara penyajian pesanan: ambil / makan di tempat / antar ke kelas */
export type CheckoutPickupMethod = "takeaway" | "dinein" | "delivery";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  kelas?: string;
  phone?: string;
  sellerId?: string;
  /** data URL base64 foto profil */
  avatar?: string;
  /** false = akun disuspend oleh Super Admin (tidak bisa login) */
  isActive?: boolean;
  createdAt: number;
}

export interface Seller {
  id: string;
  name: string;
  ownerUserId: string;
  /** WhatsApp kantin/pedagang (tujuan chat customer + notifikasi) */
  phone: string;
  /** Kode lapak di kantin, mis. A1 */
  booth?: string;
  isActive: boolean;
  createdAt: number;
  /** Deskripsi singkat lapak (opsional) */
  description?: string;
  /** Rating lapak (1–5), rata-rata dari ulasan customer */
  rating?: number;
  /** Jumlah ulasan untuk rating */
  reviewCount?: number;
  /** Jumlah bintang total (untuk hitung ulang rata-rata) */
  ratingSum?: number;
  /** Status buka/tutup gerai (seller bisa toggle sendiri) */
  isOpen?: boolean;
  /** Ongkir antar ke kelas (Rp) — aktif per-produk lewat Product.canDeliver */
  deliveryFee?: number;
}

/** Ulasan lapak (dari halaman profil lapak / pesanan selesai) */
export interface SellerReview {
  id: string;
  sellerId: string;
  buyerName: string;
  buyerId?: string | null;
  stars: number;
  comment: string;
  createdAt: number;
  /** orderId jika berasal dari rating pesanan */
  orderId?: string;
}

/** Request pencairan saldo penjual */
export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  /** Jumlah yang diminta penjual (sebelum fee) */
  amount: number;
  /** Fee platform yang dipotong */
  fee: number;
  /** Jumlah bersih yang diterima penjual = amount - fee */
  netAmount: number;
  method: WithdrawalMethod;
  /** Nomor rekening / e-wallet */
  accountNumber: string;
  /** Nama pemilik rekening */
  accountName: string;
  status: WithdrawalStatus;
  /** Catatan admin saat tolak (opsional) */
  rejectReason?: string;
  /** ID admin yang proses */
  processedBy?: string;
  createdAt: number;
  processedAt?: number;
}

/** Varian di dalam produk utama (harga & stok per varian) */
export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  /** Foto varian opsional — fallback ke foto produk utama */
  image?: string;
  isActive?: boolean;
}

/**
 * Produk utama (induk). Yang tampil di kartu menu.
 * Harga/stok aktual ada di variants[].
 */
export interface Product {
  id: string;
  sellerId: string;
  name: string;
  category: ProductCategory;
  description: string;
  /** Foto cover produk utama */
  image: string;
  isActive: boolean;
  /** Produk ini bisa diantar ke kelas (per-produk, bukan per-gerai) */
  canDeliver?: boolean;
  createdAt: number;
  updatedAt?: number;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  sellerId: string;
  /** Label tampilan, mis. "Mie · Mie Goreng Rendang" */
  name: string;
  productName: string;
  variantName: string;
  price: number;
  image: string;
  qty: number;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  productName?: string;
  variantName?: string;
  price: number;
  qty: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  sellerId: string;
  sellerName: string;
  /** Snapshot foto profil penjual (pemilik lapak) saat order */
  sellerAvatar?: string;
  buyerId: string | null;
  buyerName: string;
  buyerClass: string;
  buyerPhone: string;
  /** Snapshot foto profil customer saat order */
  buyerAvatar?: string;
  items: OrderItem[];
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  sellerAmount: number;
  total: number;
  /** Biaya admin QRIS dari payment gateway (fee yang ditambahkan ke customer) */
  paymentFee?: number;
  notes?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  /** online = QRIS online, canteen = bayar di tempat */
  paymentMethod?: CheckoutPaymentMethod;
  /** Cara penyajian: takeaway / dinein / delivery (antar ke kelas) */
  pickupMethod?: CheckoutPickupMethod;
  /** Ongkos antar ke kelas (diisi saat pickupMethod=delivery) */
  deliveryFee?: number;
  /** Invoice id dari payment gateway */
  bayarInvoiceId?: string;
  bayarPaymentUrl?: string;
  paidAt?: number;
  createdAt: number;
  updatedAt: number;
  stockRestored?: boolean;
  seenBySeller?: boolean;
  /** Rating toko 1–5 dari customer (setelah pesanan selesai) */
  rating?: number;
  /** Komentar opsional */
  ratingComment?: string;
  ratedAt?: number;
}

/** Pengumuman yang disiarkan Super Admin / Admin ke semua user */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  /** target: semua / penjual / pembeli */
  audience: "all" | "sellers" | "buyers";
  /** penulis (nama pengguna) */
  author: string;
  createdAt: number;
}

/** Entri log aktivitas / audit trail (dibatasi 200 entri terakhir) */
export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  detail?: string;
  createdAt: number;
}

export interface PlatformSettings {
  schoolName: string;
  commissionRate: number;
  platformWhatsapp: string;
  /** Tipe fee pencairan: 'percent' atau 'flat' */
  withdrawalFeeType: WithdrawalFeeType;
  /** Nilai fee pencairan (persen atau nominal) */
  withdrawalFeeValue: number;
  /** Kategori menu yang dikelola Super Admin (default: Makanan, Minuman, Snack) */
  menuCategories: string[];
  /** Pengumuman / broadcast */
  announcements: Announcement[];
  /** Jam operasional platform (opsional, dinonaktifkan = buka 24 jam) */
  operatingHours: {
    enabled: boolean;
    openTime: string;
    closeTime: string;
  };
  /** Metode pembayaran yang diaktifkan platform */
  enabledPaymentMethods: CheckoutPaymentMethod[];
  /** Log aktivitas / audit trail */
  activityLog: ActivityEntry[];
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  kelas?: string;
  phone?: string;
  sellerId?: string;
  avatar?: string;
}

/** Konfigurasi pencairan otomatis penjual (disimpan lokal per perangkat) */
export interface AutoPayoutConfig {
  enabled: boolean;
  /** Saldo minimum yang memicu pencairan otomatis */
  threshold: number;
  method: WithdrawalMethod;
  accountNumber: string;
  accountName: string;
}

/** Item dalam laporan penjualan harian (menu + jumlah terjual) */
export interface SalesReportItem {
  id: string;
  name: string;
  qty: number;
}

export type SalesReportStatus = "submitted" | "verified";

/** Setor laporan penjualan harian dari pedagang → bendahara */
export interface SalesReport {
  id: string;
  sellerId: string;
  sellerName: string;
  booth?: string;
  /** Tanggal laporan (YYYY-MM-DD) */
  date: string;
  items: SalesReportItem[];
  totalRevenue: number;
  notes?: string;
  status: SalesReportStatus;
  verifiedBy?: string;
  verifiedAt?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface AppState {
  users: User[];
  sellers: Seller[];
  products: Product[];
  orders: Order[];
  settings: PlatformSettings;
  cart: CartItem[];
  session: SessionUser | null;
  orderSeq: number;
  /** Ulasan lapak (lokal + digabung dari rating pesanan) */
  reviews: SellerReview[];
  /** Request pencairan dari semua penjual */
  withdrawals: WithdrawalRequest[];
  /** Konfigurasi pencairan otomatis per penjual (lokal, seperti reviews) */
  autoPayouts: Record<string, AutoPayoutConfig>;
  /** Laporan setoran penjualan harian (penjual → bendahara) */
  salesReports: SalesReport[];
}
