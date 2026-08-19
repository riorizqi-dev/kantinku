"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Package,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  MessageCircle,
  Store,
  LayoutDashboard,
  Camera,
  UserRound,
  ChevronRight,
  Landmark,
  BarChart3,
  Sparkles,
  Zap,
  Printer,
} from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { ImageUploadField } from "@/components/products/ImageUploadField";
import { useApp } from "@/context/AppContext";
import {
  formatDate,
  formatRupiah,
  orderStatusLabel,
  paymentStatusLabel,
  paymentMethodLabel,
  cn,
  uid,
  withdrawalStatusLabel,
  withdrawalMethodLabel,
} from "@/lib/utils";
import {
  buildOrderToBuyerMessage,
  openWhatsApp,
} from "@/lib/whatsapp";
import type {
  AutoPayoutConfig,
  OrderStatus,
  Product,
  ProductCategory,
  ProductVariant,
  WithdrawalMethod,
} from "@/lib/types";
import {
  getProductMinPrice,
  getProductTotalStock,
  hasPriceRange,
} from "@/lib/product";
import { PageTransition } from "@/components/motion/Reveal";
import { Avatar } from "@/components/profile/Avatar";
import { ContactAdmin } from "@/components/layout/ContactAdmin";
import { SellerReport } from "@/components/reports/SellerReport";
import { PricingCalculator } from "@/components/reports/PricingCalculator";
import Link from "next/link";

type Tab = "orders" | "products" | "pencairan" | "laporan" | "settings";

type VariantDraft = {
  key: string;
  id?: string;
  name: string;
  price: string;
  stock: string;
  image: string;
};

function emptyVariant(): VariantDraft {
  return {
    key: uid("vd"),
    name: "",
    price: "",
    stock: "10",
    image: "",
  };
}

function productToDrafts(p: Product): VariantDraft[] {
  return (p.variants || []).map((v) => ({
    key: v.id || uid("vd"),
    id: v.id,
    name: v.name,
    price: String(v.price),
    stock: String(v.stock),
    image: v.image?.startsWith("data:") || v.image?.startsWith("http")
      ? v.image
      : "",
  }));
}

const STATUS_FLOW: OrderStatus[] = [
  "waiting",
  "processing",
  "ready",
  "completed",
];

/** Template notifikasi WA ke customer */
const WA_TEMPLATES: {
  id: string;
  label: string;
  build: (o: {
    orderNumber: string;
    buyerName: string;
    sellerName: string;
    total: string;
  }) => string;
}[] = [
  {
    id: "invoice",
    label: "Kirim invoice",
    build: (o) =>
      `Halo ${o.buyerName},\n\n*Invoice ${o.orderNumber}*\nDari: ${o.sellerName}\nTotal: ${o.total}\n\nTerima kasih sudah memesan di KantinKu.`,
  },
  {
    id: "processing",
    label: "Sedang disiapkan",
    build: (o) =>
      `Halo ${o.buyerName},\n\nPesanan *${o.orderNumber}* sedang *disiapkan* di ${o.sellerName}.\nMohon ditunggu ya.`,
  },
  {
    id: "ready",
    label: "Siap diambil",
    build: (o) =>
      `Halo ${o.buyerName},\n\nPesanan *${o.orderNumber}* sudah *SIAP DIAMBIL*.\nSilakan datang ke counter ${o.sellerName}.`,
  },
  {
    id: "pickup",
    label: "Silakan ke counter",
    build: (o) =>
      `Halo ${o.buyerName},\n\nPesanan *${o.orderNumber}* menunggu di counter.\nSilakan ambil sekarang di *${o.sellerName}*.`,
  },
];

function SellerDashboardInner() {
  const {
    state,
    updateOrderStatus,
    markOrdersSeen,
    getSellerUnreadCount,
    saveProduct,
    deleteProduct,
    setProductActive,
    updateSeller,
    markCanteenPaid,
    getSellerBalance,
    requestWithdrawal,
    setAutoPayout,
    toast,
  } = useApp();

  const session = state.session!;
  const sellerId = session.sellerId!;

  const [tab, setTab] = useState<Tab>("orders");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [imageData, setImageData] = useState("");
  const [imageError, setImageError] = useState("");
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([
    emptyVariant(),
  ]);
  const [variantError, setVariantError] = useState("");
  const [productCanDeliver, setProductCanDeliver] = useState<boolean>(false);

  // Pencairan state
  const [wdAmount, setWdAmount] = useState("");
  const [wdMethod, setWdMethod] = useState<WithdrawalMethod>("bank");
  const [wdAccount, setWdAccount] = useState("");
  const [wdName, setWdName] = useState("");
  const [wdError, setWdError] = useState("");

  // Auto-payout state
  const existingAuto = state.autoPayouts?.[sellerId];
  const [apEnabled, setApEnabled] = useState<boolean>(!!existingAuto?.enabled);
  const [apThreshold, setApThreshold] = useState<string>(
    existingAuto ? String(existingAuto.threshold) : "100000"
  );
  const [apMethod, setApMethod] = useState<WithdrawalMethod>(
    existingAuto?.method || "bank"
  );
  const [apAccount, setApAccount] = useState<string>(
    existingAuto?.accountNumber || ""
  );
  const [apName, setApName] = useState<string>(existingAuto?.accountName || "");
  const [apError, setApError] = useState("");

  // Buka/tutup gerai
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Delivery to class
  const [deliveryFee, setDeliveryFee] = useState<string>("2000");

  useEffect(() => {
    if (tab === "orders") markOrdersSeen(sellerId);
  }, [sellerId, tab, markOrdersSeen, state.orders.length]);

  const seller = state.sellers.find((s) => s.id === sellerId);
  const unread = getSellerUnreadCount(sellerId);

  // Sync state dengan data seller saat seller berubah
  useEffect(() => {
    if (seller) {
      setIsOpen(seller.isOpen !== false);
      setDeliveryFee(seller.deliveryFee ? String(seller.deliveryFee) : "2000");
    }
  }, [seller]);

  // ——— Isolasi ketat per sellerId ———
  const orders = useMemo(() => {
    let list = state.orders.filter(
      (o) =>
        o.sellerId === sellerId &&
        (o.paymentStatus === "paid" ||
          (o.paymentMethod === "canteen" && o.paymentStatus !== "failed"))
    );
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [state.orders, sellerId, statusFilter]);

  const products = useMemo(
    () => state.products.filter((p) => p.sellerId === sellerId),
    [state.products, sellerId]
  );

  const revenue = useMemo(() => {
    const paid = state.orders.filter(
      (o) =>
        o.sellerId === sellerId &&
        o.paymentStatus === "paid" &&
        o.status !== "cancelled"
    );
    return {
      gross: paid.reduce((n, o) => n + o.subtotal, 0),
      commission: paid.reduce((n, o) => n + o.commissionAmount, 0),
      net: paid.reduce((n, o) => n + o.sellerAmount, 0),
      count: paid.length,
    };
  }, [state.orders, sellerId]);

  const balance = useMemo(
    () => getSellerBalance(sellerId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getSellerBalance, sellerId]
  );

  const myWithdrawals = useMemo(
    () =>
      state.withdrawals
        .filter((w) => w.sellerId === sellerId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [state.withdrawals, sellerId]
  );

  function sendWaToCustomer(
    orderId: string,
    templateId?: string,
    forceStatus?: OrderStatus
  ) {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || order.sellerId !== sellerId) return;
    if (!order.buyerPhone) {
      toast("Customer belum mengisi nomor WhatsApp", "warning");
      return;
    }
    try {
      let message: string;
      if (templateId) {
        const t = WA_TEMPLATES.find((x) => x.id === templateId);
        message = t
          ? t.build({
              orderNumber: order.orderNumber,
              buyerName: order.buyerName,
              sellerName: order.sellerName,
              total: formatRupiah(order.total),
            })
          : buildOrderToBuyerMessage(order);
      } else {
        message = buildOrderToBuyerMessage(
          forceStatus ? { ...order, status: forceStatus } : order
        );
      }
      openWhatsApp(order.buyerPhone, message);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal buka WhatsApp", "error");
    }
  }

  function printReceipt(order: (typeof state.orders)[number]) {
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) {
      toast("Browser memblokir pop-up. Izinkan pop-up lalu coba lagi.", "warning");
      return;
    }
    const items = order.items
      .map(
        (it) =>
          `<tr><td style="padding:4px 8px;font-size:12px">${it.name}</td><td style="padding:4px 8px;font-size:12px;text-align:center">${it.qty}</td><td style="padding:4px 8px;font-size:12px;text-align:right">${formatRupiah(
            it.price * it.qty
          )}</td></tr>`
      )
      .join("");
    w.document.write(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>Struk ${order.orderNumber}</title></head>
<body style="font-family:monospace;max-width:360px;margin:0 auto;padding:16px;color:#111">
  <h2 style="text-align:center;margin:0 0 4px;font-size:18px">KantinKu — ${state.settings.schoolName}</h2>
  <p style="text-align:center;margin:0 0 12px;font-size:11px">${seller?.booth ? `Lapak ${seller.booth} · ` : ""}${order.sellerName}</p>
  <hr/>
  <p style="font-size:12px;margin:6px 0"><strong>No. Antrian:</strong> #${order.orderNumber}</p>
  <p style="font-size:12px;margin:6px 0"><strong>Pembeli:</strong> ${order.buyerName} (${order.buyerClass})</p>
  <p style="font-size:12px;margin:6px 0"><strong>Waktu:</strong> ${formatDate(order.createdAt)}</p>
  <hr/>
  <table style="width:100%;border-collapse:collapse">
    <tr><th style="text-align:left;font-size:11px;padding:4px 8px">Item</th><th style="font-size:11px;padding:4px 8px">Qty</th><th style="text-align:right;font-size:11px;padding:4px 8px">Subtotal</th></tr>
    ${items}
  </table>
  <hr/>
  <p style="font-size:12px;margin:6px 0;display:flex;justify-content:space-between"><span>Subtotal</span><span>${formatRupiah(order.subtotal)}</span></p>
  <p style="font-size:12px;margin:6px 0;display:flex;justify-content:space-between"><span>Total</span><span><strong>${formatRupiah(order.total)}</strong></span></p>
  <hr/>
  <p style="font-size:11px;text-align:center;margin:10px 0 0">Terima kasih — ambil pesanan di counter.</p>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`);
    w.document.close();
  }

  function onSaveProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const img = imageData || editing?.image || "";
    if (
      !img ||
      (!img.startsWith("data:image") && !img.startsWith("http"))
    ) {
      setImageError("Upload foto produk dulu (gallery atau kamera)");
      return;
    }

    const variants: ProductVariant[] = variantDrafts
      .map((d) => ({
        id: d.id || uid("var"),
        name: d.name.trim(),
        price: Math.max(0, Number(d.price) || 0),
        stock: Math.max(0, Math.floor(Number(d.stock) || 0)),
        image: d.image || undefined,
        isActive: true as const,
      }))
      .filter((v) => v.name.length > 0);

    if (!variants.length) {
      setVariantError("Minimal 1 varian (nama + harga + stok)");
      return;
    }
    setImageError("");
    setVariantError("");

    saveProduct(
      {
        name: String(fd.get("name") || "").trim(),
        category: String(fd.get("category")) as ProductCategory,
        description: String(fd.get("description") || "").trim(),
        image: img,
        sellerId,
        variants,
        canDeliver: productCanDeliver,
      },
      editing?.id
    );
    setShowForm(false);
    setEditing(null);
    setImageData("");
    setProductCanDeliver(false);
    setVariantDrafts([emptyVariant()]);
  }

  function openCreate() {
    setEditing(null);
    setImageData("");
    setImageError("");
    setVariantError("");
    setProductCanDeliver(false);
    setVariantDrafts([emptyVariant()]);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    if (p.sellerId !== sellerId) return;
    setEditing(p);
    setProductCanDeliver(p.canDeliver === true);
    setImageData(
      p.image?.startsWith("data:") || p.image?.startsWith("http")
        ? p.image
        : ""
    );
    setImageError("");
    setVariantError("");
    setVariantDrafts(
      p.variants?.length ? productToDrafts(p) : [emptyVariant()]
    );
    setShowForm(true);
  }

  function updateVariantDraft(
    key: string,
    patch: Partial<VariantDraft>
  ) {
    setVariantDrafts((list) =>
      list.map((v) => (v.key === key ? { ...v, ...patch } : v))
    );
  }

  function onSaveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateSeller(sellerId, {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      booth: String(fd.get("booth") || "").trim(),
      isOpen,
      deliveryFee: Number(deliveryFee) || 0,
    });
  }

  function onSaveAutoPayout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!apEnabled) {
      setAutoPayout(sellerId, null);
      setApError("");
      return;
    }
    const threshold = Number(apThreshold) || 0;
    if (threshold < 30000) {
      setApError("Minimal threshold Rp 30.000");
      return;
    }
    if (!apAccount.trim()) {
      setApError("Nomor rekening/e-wallet wajib diisi");
      return;
    }
    if (!apName.trim()) {
      setApError("Nama pemilik wajib diisi");
      return;
    }
    setApError("");
    const config: AutoPayoutConfig = {
      enabled: true,
      threshold,
      method: apMethod,
      accountNumber: apAccount.trim(),
      accountName: apName.trim(),
    };
    setAutoPayout(sellerId, config);
  }

  function onRequestWithdrawal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const amount = Number(wdAmount) || 0;
    if (amount < 30000) {
      setWdError("Minimal pencairan Rp 30.000");
      return;
    }
    if (amount > balance) {
      setWdError("Melebihi saldo tersedia");
      return;
    }
    if (!wdAccount.trim()) {
      setWdError("Nomor rekening wajib diisi");
      return;
    }
    if (!wdName.trim()) {
      setWdError("Nama pemilik rekening wajib diisi");
      return;
    }
    setWdError("");
    const err = requestWithdrawal({
      sellerId,
      amount,
      method: wdMethod,
      accountNumber: wdAccount.trim(),
      accountName: wdName.trim(),
    });
    if (err) {
      setWdError(err);
      return;
    }
    setWdAmount("");
    setWdAccount("");
    setWdName("");
  }

  return (
    <PageTransition>
      <div className="min-h-[100dvh] w-full bg-stone-100 dark:bg-[#0a0a0b] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FFB300]/90">
                <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.5} />
                Dashboard Penjual
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-stone-900 dark:text-white">
                {seller?.name || "Lapak saya"}
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-white/40">
                {seller?.booth ? `Lapak ${seller.booth} · ` : ""}
                Halo, {session.name} — hanya data lapak Anda
              </p>
            </div>
            {unread > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFB300] px-4 py-2 text-sm font-semibold text-[#1c1917]">
                <Bell className="h-4 w-4" strokeWidth={1.5} />
                {unread} pesanan baru
              </div>
            )}
          </div>

          {/* Profil penjual — menonjol, mudah ditemukan orang tua / penjual */}
          <Link
            href="/dashboard/seller/profile"
            className="group mt-6 flex flex-col gap-4 rounded-2xl border border-[#FFB300]/35 bg-gradient-to-br from-amber-50 via-white to-white dark:from-[#FFB300]/15 dark:via-[#121214] dark:to-[#121214] p-4 shadow-[0_0_0_1px_rgba(249,115,22,0.12)] transition hover:border-[#FFB300]/55 hover:from-[#FFB300]/22 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative shrink-0">
                <Avatar
                  name={session.name}
                  avatar={session.avatar}
                  size="xl"
                  className="!h-[4.5rem] !w-[4.5rem] !text-lg ring-2 ring-[#FFB300]/50 transition group-hover:ring-[#FFB300]"
                />
                <span
                  className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-[#0a0a0b] bg-[#FFB300] text-[#1c1917] shadow-md"
                  aria-hidden
                >
                  <Camera className="h-4 w-4" strokeWidth={2} />
                </span>
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FFC107]">
                  Profil Anda
                </p>
                <p className="mt-0.5 truncate text-lg font-semibold text-stone-900 dark:text-white">
                  {session.name}
                </p>
                <p className="mt-0.5 text-sm text-stone-500 dark:text-white/45">
                  Ketuk di sini untuk ganti{" "}
                  <strong className="font-semibold text-stone-800 dark:text-white/80">
                    foto
                  </strong>{" "}
                  &amp;{" "}
                  <strong className="font-semibold text-stone-800 dark:text-white/80">
                    nama
                  </strong>
                </p>
              </div>
            </div>
            <span className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#FFB300] px-5 py-3.5 text-sm font-bold text-[#1c1917] transition group-hover:bg-[#F0A500] sm:w-auto sm:min-w-[11rem]">
              <UserRound className="h-4 w-4" strokeWidth={2} />
              Ubah Foto &amp; Nama
              <ChevronRight className="h-4 w-4 opacity-80" strokeWidth={2} />
            </span>
          </Link>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Pesanan lunas", value: String(revenue.count), icon: Package },
              { label: "Omzet kotor", value: formatRupiah(revenue.gross), icon: Wallet },
              {
                label: "Pendapatan bersih",
                value: formatRupiah(revenue.net),
                icon: Wallet,
                hint: `Komisi ${formatRupiah(revenue.commission)}`,
              },
              {
                label: "Saldo tersedia",
                value: formatRupiah(balance),
                icon: Landmark,
                hint: "Bisa dicairkan",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-stone-200 dark:border-white/[0.07] bg-white dark:bg-[#121214] p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-white/35">
                    {s.label}
                  </p>
                  <s.icon className="h-4 w-4 text-[#FFB300]" strokeWidth={1.5} />
                </div>
                <p className="mt-2 text-xl font-semibold text-stone-900 dark:text-white">{s.value}</p>
                {"hint" in s && s.hint && (
                  <p className="mt-1 text-[11px] text-stone-500 dark:text-white/30">{s.hint}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2 border-b border-stone-200 dark:border-white/[0.06] pb-3">
            {(
              [
                ["orders", "Pesanan"],
                ["products", "Produk & stok"],
                ["pencairan", "Pencairan"],
                ["laporan", "Laporan"],
                ["settings", "Pengaturan"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  tab === id
                    ? "bg-[#FFB300]/15 text-[#FFC107]"
                    : "text-stone-600 hover:bg-stone-200/80 hover:text-stone-900 dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white/80"
                )}
              >
                {label}
                {id === "orders" && unread > 0 ? ` (${unread})` : ""}
              </button>
            ))}
          </div>

          {/* ——— ORDERS ——— */}
          {tab === "orders" && (
            <div className="mt-6">
              <div className="mb-4 flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Semua"],
                    ["waiting", "Menunggu"],
                    ["processing", "Diproses"],
                    ["ready", "Siap"],
                    ["completed", "Selesai"],
                    ["cancelled", "Batal"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStatusFilter(id)}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      statusFilter === id
                        ? "bg-white text-[#0a0a0b]"
                        : "bg-stone-100 text-stone-600 hover:text-stone-900 dark:bg-white/[0.05] dark:text-white/50 dark:hover:text-white/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {!orders.length ? (
                <div className="rounded-2xl border border-dashed border-stone-200 dark:border-white/10 py-16 text-center">
                  <Store className="mx-auto h-8 w-8 text-stone-500 dark:text-white/20" />
                  <p className="mt-3 font-medium text-stone-500 dark:text-white/50">
                    Belum ada pesanan untuk lapak ini
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <article
                      key={o.id}
                      className={cn(
                        "rounded-2xl border bg-white dark:bg-[#121214] p-5",
                        !o.seenBySeller
                          ? "border-[#FFB300]/35"
                          : "border-stone-200 dark:border-white/[0.07]"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-stone-900 dark:text-white">
                              {o.orderNumber}
                            </p>
                            {!o.seenBySeller && (
                              <span className="rounded-full bg-[#FFB300] px-2 py-0.5 text-[10px] font-bold text-[#1c1917]">
                                BARU
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-stone-500 dark:text-white/35">
                            {formatDate(o.createdAt)}
                          </p>
                          <div className="mt-2 flex items-center gap-2.5">
                            <Avatar
                              name={o.buyerName}
                              avatar={
                                o.buyerAvatar ||
                                state.users.find((u) => u.id === o.buyerId)
                                  ?.avatar
                              }
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-medium text-stone-800 dark:text-white/90">
                                {o.buyerName}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-white/40">
                                Kelas {o.buyerClass}
                                {o.buyerPhone ? ` · ${o.buyerPhone}` : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#FFC107]">
                            {formatRupiah(o.total)}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-white/35">
                            {paymentMethodLabel(o.paymentMethod)} ·{" "}
                            {paymentStatusLabel(o.paymentStatus)}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-white/45">
                            {orderStatusLabel(o.status)}
                          </p>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-0.5 text-xs text-stone-500 dark:text-white/40">
                        {o.items.map((it) => (
                          <li key={it.productId + it.name}>
                            {it.name} x{it.qty}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <select
                          value={o.status}
                          onChange={(e) => {
                            const next = e.target.value as OrderStatus;
                            updateOrderStatus(o.id, next);
                            // Opsional: tawarkan WA setelah ubah status
                            if (
                              (next === "processing" || next === "ready") &&
                              o.buyerPhone
                            ) {
                              // auto open notifikasi
                              setTimeout(
                                () =>
                                  sendWaToCustomer(
                                    o.id,
                                    next === "ready" ? "ready" : "processing",
                                    next
                                  ),
                                200
                              );
                            }
                          }}
                          className="cursor-pointer rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-800 dark:border-white/10 dark:bg-black/40 dark:text-white"
                        >
                          {[...STATUS_FLOW, "cancelled" as OrderStatus].map(
                            (s) => (
                              <option key={s} value={s}>
                                {orderStatusLabel(s)}
                              </option>
                            )
                          )}
                        </select>

                        {o.paymentMethod === "canteen" &&
                          o.paymentStatus === "unpaid" && (
                            <button
                              type="button"
                              onClick={() => markCanteenPaid(o.id)}
                              className="cursor-pointer rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-[#1c1917]"
                            >
                              Tandai Lunas
                            </button>
                          )}

                        {/* WA templates → customer */}
                        <div className="flex flex-wrap gap-1.5">
                          {WA_TEMPLATES.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => sendWaToCustomer(o.id, t.id)}
                              disabled={!o.buyerPhone}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#25D366]/15 px-2.5 py-1.5 text-[11px] font-semibold text-[#25D366] transition hover:bg-[#25D366]/25 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <MessageCircle className="h-3 w-3" />
                              {t.label}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => printReceipt(o)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 transition hover:bg-stone-200 dark:bg-white/[0.06] dark:text-white/80 dark:hover:bg-white/10"
                          title="Cetak struk / nomor antrian"
                        >
                          <Printer className="h-3 w-3" strokeWidth={1.75} />
                          Cetak Struk
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ——— PRODUCTS ——— */}
          {tab === "products" && (
            <div className="mt-6">
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#FFB300] px-4 py-2.5 text-sm font-semibold text-[#1c1917]"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.5} /> Tambah Produk
                </button>
              </div>

              {showForm && (
                <form
                  onSubmit={onSaveProduct}
                  className="mb-6 space-y-5 rounded-2xl border border-stone-200 dark:border-white/[0.08] bg-white dark:bg-[#121214] p-5"
                >
                  <p className="font-semibold text-stone-900 dark:text-white">
                    {editing ? "Edit Produk Utama" : "Produk Utama Baru"}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-white/40">
                    Nama produk utama tampil di menu (contoh: Mie, Teh). Harga
                    &amp; stok diatur per varian.
                  </p>

                  <ImageUploadField
                    value={
                      imageData ||
                      (editing?.image?.startsWith("data:") ||
                      editing?.image?.startsWith("http")
                        ? editing.image
                        : "")
                    }
                    onChange={(v) => {
                      setImageData(v);
                      setImageError("");
                    }}
                    error={imageError}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      name="name"
                      required
                      defaultValue={editing?.name}
                      placeholder="Nama produk utama (cth: Mie)"
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                    />
                    <select
                      name="category"
                      defaultValue={editing?.category || "Makanan"}
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-black/30 dark:text-white"
                    >
                      <option>Makanan</option>
                      <option>Minuman</option>
                      <option>Snack</option>
                    </select>
                    <textarea
                      name="description"
                      defaultValue={editing?.description}
                      placeholder="Deskripsi produk"
                      rows={2}
                      className="sm:col-span-2 resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                    />
                  </div>

                  {/* Bisa diantar ke kelas */}
                  <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-black/20">
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-white">
                        Bisa Antar ke Kelas
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-white/40">
                        Customer boleh memilih antar ke kelas bila produk ini
                        ada di keranjangnya
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductCanDeliver(!productCanDeliver)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                        productCanDeliver
                          ? "bg-emerald-500"
                          : "bg-stone-300 dark:bg-stone-600"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                          productCanDeliver ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {/* Variants editor */}
                  <div className="space-y-3 rounded-xl border border-stone-200 dark:border-white/[0.08] bg-stone-50 dark:bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-stone-900 dark:text-white">
                            Varian produk
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-white/35">
                            Contoh: Mie Goreng Rendang, Es Teh Manis, …
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCalculator(true)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#FFB300]/10 px-3 py-1.5 text-xs font-semibold text-[#FFB300] transition hover:bg-[#FFB300]/20"
                          >
                            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Kalkulator Harga AI
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setVariantDrafts((list) => [...list, emptyVariant()])
                            }
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-900 hover:bg-stone-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                          >
                            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Tambah varian
                          </button>
                        </div>
                      </div>

                    {variantError && (
                      <p className="text-xs font-medium text-red-400">
                        {variantError}
                      </p>
                    )}

                    <div className="space-y-3">
                      {variantDrafts.map((v, idx) => (
                        <div
                          key={v.key}
                          className="rounded-xl border border-stone-200 dark:border-white/[0.06] bg-white dark:bg-[#121214] p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-white/35">
                              Varian {idx + 1}
                            </span>
                            {variantDrafts.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setVariantDrafts((list) =>
                                    list.filter((x) => x.key !== v.key)
                                  )
                                }
                                className="cursor-pointer rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                                aria-label="Hapus varian"
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  strokeWidth={1.5}
                                />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <input
                              required
                              value={v.name}
                              onChange={(e) =>
                                updateVariantDraft(v.key, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="Nama varian"
                              className="sm:col-span-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                            />
                            <input
                              required
                              type="number"
                              min={0}
                              value={v.price}
                              onChange={(e) =>
                                updateVariantDraft(v.key, {
                                  price: e.target.value,
                                })
                              }
                              placeholder="Harga"
                              className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                            />
                            <input
                              required
                              type="number"
                              min={0}
                              value={v.stock}
                              onChange={(e) =>
                                updateVariantDraft(v.key, {
                                  stock: e.target.value,
                                })
                              }
                              placeholder="Stok"
                              className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                            />
                            <div className="sm:col-span-1">
                              <label className="mb-1 block text-[10px] font-medium text-stone-500 dark:text-white/30">
                                Foto varian (opsional)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full text-[11px] text-stone-500 file:mr-2 file:rounded-lg file:border-0 file:bg-stone-200 file:px-2 file:py-1.5 file:text-[11px] file:font-semibold file:text-stone-700 dark:text-white/50 dark:file:bg-white/10 dark:file:text-white"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const { fileToDataUrl } = await import(
                                      "@/lib/image-upload"
                                    );
                                    const dataUrl = await fileToDataUrl(file);
                                    updateVariantDraft(v.key, {
                                      image: dataUrl,
                                    });
                                  } catch {
                                    toast("Gagal upload foto varian", "error");
                                  }
                                  e.target.value = "";
                                }}
                              />
                              {v.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={v.image}
                                  alt=""
                                  className="mt-1.5 h-12 w-12 rounded-lg object-cover"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditing(null);
                        setImageData("");
                        setVariantDrafts([emptyVariant()]);
                      }}
                      className="cursor-pointer rounded-full border border-stone-200 dark:border-white/10 px-4 py-2 text-sm font-semibold text-stone-500 dark:text-white/70"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="cursor-pointer rounded-full bg-[#FFB300] px-4 py-2 text-sm font-semibold text-[#1c1917]"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              )}

              {showCalculator && (
                <PricingCalculator
                  products={state.products}
                  category={
                    (editing?.category || "Makanan") as ProductCategory
                  }
                  initialCost={Number(
                    variantDrafts.find((v) => v.price)?.price || 0
                  )}
                  onApply={(price) => {
                    setVariantDrafts((list) =>
                      list.length
                        ? list.map((v, i) =>
                            i === 0 ? { ...v, price: String(price) } : v
                          )
                        : list
                    );
                    setShowCalculator(false);
                    toast(
                      `Harga varian pertama diset ke ${formatRupiah(price)}`
                    );
                  }}
                  onClose={() => setShowCalculator(false)}
                />
              )}

              <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/[0.07]">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-stone-50 dark:bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-white/35">
                    <tr>
                      <th className="px-4 py-3">Produk utama</th>
                      <th className="px-4 py-3">Varian</th>
                      <th className="px-4 py-3">Harga</th>
                      <th className="px-4 py-3">Stok total</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {products.map((p) => {
                      const totalStock = getProductTotalStock(p);
                      const minPrice = getProductMinPrice(p);
                      const range = hasPriceRange(p);
                      const vCount = p.variants?.length || 0;
                      return (
                        <tr key={p.id} className="bg-white dark:bg-[#121214] align-top">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.image}
                                alt=""
                                className="h-10 w-10 rounded-lg object-cover bg-stone-100 dark:bg-black/40"
                              />
                              <div>
                                <p className="font-medium text-stone-900 dark:text-white">
                                  {p.name}
                                </p>
                                <p className="text-xs text-stone-500 dark:text-white/35">
                                  {p.category}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold text-stone-500 dark:text-white/70">
                              {vCount} varian
                            </p>
                            <ul className="mt-1 max-w-[220px] space-y-0.5 text-[11px] text-stone-500 dark:text-white/40">
                              {(p.variants || []).slice(0, 4).map((v) => (
                                <li key={v.id} className="truncate">
                                  {v.name} · {formatRupiah(v.price)} · stok{" "}
                                  {v.stock}
                                </li>
                              ))}
                              {vCount > 4 && (
                                <li className="text-stone-500 dark:text-white/30">
                                  +{vCount - 4} lainnya
                                </li>
                              )}
                            </ul>
                          </td>
                          <td className="px-4 py-3 text-stone-800 dark:text-white/80">
                            {range ? (
                              <span>
                                <span className="block text-[10px] uppercase text-stone-500 dark:text-white/35">
                                  Mulai dari
                                </span>
                                {formatRupiah(minPrice)}
                              </span>
                            ) : (
                              formatRupiah(minPrice)
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                totalStock <= 0
                                  ? "font-semibold text-red-400"
                                  : totalStock <= 5
                                    ? "font-semibold text-amber-400"
                                    : "font-semibold text-[#FFC107]"
                              }
                            >
                              {totalStock}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setProductActive(p.id, !p.isActive)}
                                className={cn(
                                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                                  p.isActive
                                    ? "bg-emerald-500"
                                    : "bg-stone-300 dark:bg-stone-600"
                                )}
                                title={
                                  p.isActive
                                    ? "Nonaktifkan produk"
                                    : "Aktifkan produk"
                                }
                              >
                                <span
                                  className={cn(
                                    "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                                    p.isActive ? "translate-x-6" : "translate-x-1"
                                  )}
                                />
                              </button>
                              <span
                                className={cn(
                                  "text-[11px] font-semibold",
                                  p.isActive
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-stone-400 dark:text-white/35"
                                )}
                              >
                                {p.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(p)}
                                className="cursor-pointer rounded-lg p-2 text-[#FFC107] hover:bg-stone-100 dark:bg-white/[0.04]"
                                title="Edit produk & varian"
                              >
                                <Pencil
                                  className="h-4 w-4"
                                  strokeWidth={1.5}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Hapus produk ini beserta semua variannya?"))
                                    deleteProduct(p.id);
                                }}
                                className="cursor-pointer rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2
                                  className="h-4 w-4"
                                  strokeWidth={1.5}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!products.length && (
                  <p className="py-10 text-center text-sm text-stone-500 dark:text-white/40">
                    Belum ada produk. Klik Tambah Produk.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ——— PENCAIRAN ——— */}
          {tab === "pencairan" && (
            <div className="mt-6 space-y-6">
              {/* Saldo & Form Request */}
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="rounded-2xl border border-[#FFB300]/30 bg-gradient-to-br from-amber-50 via-white to-white dark:from-[#FFB300]/15 dark:via-[#121214] dark:to-[#121214] p-5 lg:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#FFB300]">
                    Saldo Tersedia
                  </p>
                  <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-white">
                    {formatRupiah(balance)}
                  </p>
                  <p className="mt-1 text-xs text-stone-500 dark:text-white/40">
                    Minimal pencairan Rp 30.000
                  </p>
                  {state.settings.withdrawalFeeType === "percent" ? (
                    <p className="mt-2 text-[11px] text-stone-500 dark:text-white/35">
                      Fee pencairan: {state.settings.withdrawalFeeValue}% dari
                      jumlah
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-stone-500 dark:text-white/35">
                      Fee pencairan: {formatRupiah(state.settings.withdrawalFeeValue)} / transaksi
                    </p>
                  )}
                </div>

                <form
                  onSubmit={onRequestWithdrawal}
                  className="space-y-4 rounded-2xl border border-stone-200 dark:border-white/[0.07] bg-white dark:bg-[#121214] p-5 lg:col-span-3"
                >
                  <p className="font-semibold text-stone-900 dark:text-white">
                    Request Pencairan
                  </p>
                  {wdError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      {wdError}
                    </p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-500 dark:text-white/40">
                        Jumlah (Rp)
                      </label>
                      <input
                        type="number"
                        min={30000}
                        max={balance}
                        step={1000}
                        value={wdAmount}
                        onChange={(e) => {
                          setWdAmount(e.target.value);
                          setWdError("");
                        }}
                        placeholder="Minimal Rp 30.000"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-500 dark:text-white/40">
                        Metode
                      </label>
                      <div className="relative">
                        <select
                          value={wdMethod}
                          onChange={(e) =>
                            setWdMethod(e.target.value as WithdrawalMethod)
                          }
                          className="w-full appearance-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-stone-900 transition focus:border-[#FFB300] focus:ring-2 focus:ring-[#FFB300]/20 dark:border-white/10 dark:bg-[#1a1a1c] dark:text-white dark:focus:border-[#FFB300] dark:focus:ring-[#FFB300]/20"
                        >
                          <option value="bank" className="bg-white text-stone-900 dark:bg-[#1a1a1c] dark:text-white">
                            Rekening Bank
                          </option>
                          <option value="dana" className="bg-white text-stone-900 dark:bg-[#1a1a1c] dark:text-white">
                            DANA
                          </option>
                          <option value="ovo" className="bg-white text-stone-900 dark:bg-[#1a1a1c] dark:text-white">
                            OVO
                          </option>
                          <option value="gopay" className="bg-white text-stone-900 dark:bg-[#1a1a1c] dark:text-white">
                            GoPay
                          </option>
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-white/40">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-500 dark:text-white/40">
                        {wdMethod === "bank"
                          ? "Nomor Rekening"
                          : "Nomor e-wallet"}
                      </label>
                      <input
                        type="text"
                        value={wdAccount}
                        onChange={(e) => {
                          setWdAccount(e.target.value);
                          setWdError("");
                        }}
                        placeholder={
                          wdMethod === "bank"
                            ? "1234567890"
                            : "08xxxxxxxxxx"
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-500 dark:text-white/40">
                        Nama Pemilik
                      </label>
                      <input
                        type="text"
                        value={wdName}
                        onChange={(e) => {
                          setWdName(e.target.value);
                          setWdError("");
                        }}
                        placeholder="Nama sesuai rekening"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={balance < 30000}
                    className="cursor-pointer rounded-full bg-[#FFB300] px-6 py-2.5 text-sm font-semibold text-[#1c1917] transition hover:bg-[#F0A500] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Kirim Request
                  </button>
                </form>
              </div>

              {/* Auto-payout */}
              <form
                onSubmit={onSaveAutoPayout}
                className="rounded-2xl border border-[#FFB300]/30 bg-white dark:bg-[#121214] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFB300]/15 text-[#FFB300]">
                      <Zap className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900 dark:text-white">
                        Pencairan Otomatis
                      </p>
                      <p className="text-xs text-stone-500 dark:text-white/40">
                        Saldo langsung dicairkan saat mencapai batas — tanpa
                        perlu request manual
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={apEnabled}
                      onChange={(e) => {
                        setApEnabled(e.target.checked);
                        setApError("");
                      }}
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-[#FFB300] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
                  </label>
                </div>

                {apEnabled && (
                  <div className="mt-4 space-y-4 border-t border-stone-100 pt-4 dark:border-white/[0.06]">
                    {apError && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                        {apError}
                      </p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500 dark:text-white/40">
                          Batas saldo (Rp)
                        </label>
                        <input
                          type="number"
                          min={30000}
                          step={10000}
                          value={apThreshold}
                          onChange={(e) => {
                            setApThreshold(e.target.value);
                            setApError("");
                          }}
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-black/30 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500 dark:text-white/40">
                          Metode
                        </label>
                        <select
                          value={apMethod}
                          onChange={(e) =>
                            setApMethod(e.target.value as WithdrawalMethod)
                          }
                          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-[#1a1a1c] dark:text-white"
                        >
                          <option value="bank">Rekening Bank</option>
                          <option value="dana">DANA</option>
                          <option value="ovo">OVO</option>
                          <option value="gopay">GoPay</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500 dark:text-white/40">
                          {apMethod === "bank" ? "Nomor Rekening" : "Nomor e-wallet"}
                        </label>
                        <input
                          type="text"
                          value={apAccount}
                          onChange={(e) => {
                            setApAccount(e.target.value);
                            setApError("");
                          }}
                          placeholder="1234567890 / 08xx"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-black/30 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-500 dark:text-white/40">
                          Nama Pemilik
                        </label>
                        <input
                          type="text"
                          value={apName}
                          onChange={(e) => {
                            setApName(e.target.value);
                            setApError("");
                          }}
                          placeholder="Nama sesuai rekening"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-black/30 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className="cursor-pointer rounded-full bg-[#FFB300] px-5 py-2 text-sm font-semibold text-[#1c1917] transition hover:bg-[#F0A500]"
                      >
                        {apEnabled ? "Aktifkan Pencairan Otomatis" : "Simpan"}
                      </button>
                      <p className="text-[11px] text-stone-400 dark:text-white/30">
                        Setiap pesanan lunas menambah saldo; saat saldo ≥ batas,
                        sistem langsung membuat pencairan (tanpa menunggu admin).
                      </p>
                    </div>
                  </div>
                )}
              </form>

              {/* Riwayat pencairan */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-stone-900 dark:text-white">
                  Riwayat Pencairan
                </h3>
                {!myWithdrawals.length ? (
                  <div className="rounded-2xl border border-dashed border-stone-200 dark:border-white/10 py-12 text-center">
                    <Landmark className="mx-auto h-7 w-7 text-stone-500 dark:text-white/20" />
                    <p className="mt-2 text-sm text-stone-500 dark:text-white/50">
                      Belum ada riwayat pencairan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myWithdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 dark:border-white/[0.07] bg-white dark:bg-[#121214] px-5 py-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-stone-900 dark:text-white">
                              {formatRupiah(w.amount)}
                            </p>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                w.status === "pending"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : w.status === "approved"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : w.status === "completed"
                                      ? "bg-kantin-100 text-kantin-700 dark:bg-kantin-900/30 dark:text-kantin-400"
                                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {withdrawalStatusLabel(w.status)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-stone-500 dark:text-white/40">
                            {withdrawalMethodLabel(w.method)} · {w.accountNumber} ·{" "}
                            {w.accountName}
                          </p>
                          <p className="mt-0.5 text-[11px] text-stone-400 dark:text-white/30">
                            {formatDate(w.createdAt)}
                          </p>
                          {w.rejectReason && (
                            <p className="mt-1 text-[11px] text-red-500 dark:text-red-400">
                              Alasan tolak: {w.rejectReason}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-stone-500 dark:text-white/40">
                            Fee: {formatRupiah(w.fee)}
                          </p>
                          <p className="font-semibold text-[#FFC107]">
                            Diterima: {formatRupiah(w.netAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ——— LAPORAN ——— */}
          {tab === "laporan" && (
            <div className="mt-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-white">
                    <BarChart3 className="h-4 w-4 text-[#FFB300]" strokeWidth={1.75} />
                    Laporan Penjualan
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-white/40">
                    Omzet, komisi &amp; laba bersih per periode · export Excel / PDF
                  </p>
                </div>
                <ContactAdmin variant="pill" />
              </div>
              <SellerReport
                orders={state.orders.filter((o) => o.sellerId === sellerId)}
                sellerName={seller?.name || session.name}
              />
            </div>
          )}

          {/* ——— SETTINGS ——— */}
          {tab === "settings" && (
            <form
              onSubmit={onSaveSettings}
              className="mt-6 w-full space-y-5 rounded-2xl border border-stone-200 dark:border-white/[0.07] bg-white dark:bg-[#121214] p-5 sm:p-6"
            >
              <div>
                <h2 className="text-base font-semibold text-stone-900 dark:text-white">
                  Pengaturan lapak
                </h2>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-white/40">
                  Nama lapak tampil di menu customer.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="mb-1.5 block text-xs font-semibold text-stone-500 dark:text-white/40">
                    Nama Lapak
                  </label>
                  <input
                    name="name"
                    defaultValue={seller?.name}
                    required
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-black/30 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-500 dark:text-white/40">
                    Kode lapak
                  </label>
                  <input
                    name="booth"
                    defaultValue={seller?.booth}
                    placeholder="A1"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-black/30 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-500 dark:text-white/40">
                    WhatsApp Kantin
                  </label>
                  <input
                    name="phone"
                    defaultValue={seller?.phone}
                    placeholder="0812xxxxxxx"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-black/30 dark:text-white"
                  />
                </div>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-white/30">
                WA dipakai customer untuk &quot;Kirim ke Penjual&quot; dan kontak
                lapak.
              </p>

              {/* Toggle Buka / Tutup Gerai */}
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-black/30">
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-white">
                    Status Gerai
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-white/40">
                    {isOpen
                      ? "Gerai buka — customer bisa memesan"
                      : "Gerai tutup — customer tidak bisa memesan"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    isOpen ? "bg-emerald-500" : "bg-stone-300 dark:bg-stone-600"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                      isOpen ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Delivery ke Kelas */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-black/30">
                <p className="text-sm font-semibold text-stone-900 dark:text-white">
                  Ongkir Antar ke Kelas (Rp)
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500 dark:text-white/40">
                  Dikenakan saat customer memilih antar ke kelas. Aktif
                  per-produk lewat toggle &quot;Bisa Antar ke Kelas&quot; di form
                  produk.
                </p>
                <div className="mt-3">
                  <input
                    type="number"
                    min={0}
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-black/30 dark:text-white"
                    placeholder="2000"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="cursor-pointer rounded-full bg-[#FFB300] px-6 py-2.5 text-sm font-semibold text-[#1c1917]"
              >
                Simpan
              </button>
            </form>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default function SellerDashboardPage() {
  return (
    <RequireRole allow={["seller"]}>
      <SellerDashboardInner />
    </RequireRole>
  );
}
