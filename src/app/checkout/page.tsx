"use client";

import { FormEvent, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ShieldCheck,
  Store,
  QrCode,
  ShoppingBag,
  UtensilsCrossed,
  Truck,
  Clock,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useStallColor } from "@/context/StallColorContext";
import { formatRupiah, cn } from "@/lib/utils";
import type { CheckoutPaymentMethod } from "@/lib/types";
import { createBayarPaymentInBrowser } from "@/lib/bayar-browser";
import { PageTransition, Reveal } from "@/components/motion/Reveal";
import {
  QrisPayModal,
  type QrisPayPayload,
} from "@/components/payment/QrisPayModal";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 transition focus:ring-2 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500";

/** Ambil opsi jam pengambilan berdasarkan hari ini */
function getPickupTimeOptions() {
  const day = new Date().getDay(); // 0=Minggu, 1=Senin, ..., 5=Jumat, 6=Sabtu
  const isJumat = day === 5;
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return [
      { value: "09:45", label: "09:45 — Istirahat 1" },
      { value: "12:15", label: "12:15 — Istirahat 2" },
    ];
  }

  if (isJumat) {
    return [
      { value: "09:30", label: "09:30 — Istirahat 1" },
      { value: "12:45", label: "12:45 — Istirahat 2" },
    ];
  }

  // Senin — Kamis
  return [
    { value: "09:45", label: "09:45 — Istirahat 1" },
    { value: "12:15", label: "12:15 — Istirahat 2" },
  ];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { color: stallColor } = useStallColor();
  const {
    ready,
    state,
    cartSubtotal,
    createPendingOrder,
    attachBayarPayment,
    markOrderPaymentStatus,
    markOrderPaid,
    markOrderPaidByInvoice,
    toast,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] =
    useState<CheckoutPaymentMethod>("canteen");
  const [pickupMethod, setPickupMethod] = useState<"takeaway" | "dinein" | "delivery">("takeaway");
  const [pickupTime, setPickupTime] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [qrisOpen, setQrisOpen] = useState(false);
  const [qrisPayload, setQrisPayload] = useState<QrisPayPayload | null>(null);
  const session = state.session;

  const handleQrisPaid = useCallback(
    (invoiceId: string) => {
      const byInvoice = markOrderPaidByInvoice(invoiceId);
      if (!byInvoice && qrisPayload?.orderId) {
        markOrderPaid(qrisPayload.orderId, invoiceId);
      }
      toast("Pembayaran QRIS berhasil!");
      setTimeout(() => {
        setQrisOpen(false);
        router.push(
          `/orders?paid=1&order=${encodeURIComponent(
            qrisPayload?.orderNumber || ""
          )}`
        );
      }, 1200);
    },
    [
      markOrderPaid,
      markOrderPaidByInvoice,
      qrisPayload?.orderId,
      qrisPayload?.orderNumber,
      router,
      toast,
    ]
  );

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-600" />
      </div>
    );
  }

  if (!state.cart.length && !qrisOpen) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-semibold text-stone-800 dark:text-stone-100">
          Keranjang kosong
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold hover:underline"
          style={{ color: stallColor.text }}
        >
          Kembali ke menu
        </Link>
      </div>
    );
  }

  // Lookup seller dari cart (asumsi semua item di cart dari seller yang sama)
  const cartSellerId = state.cart[0]?.sellerId;
  const cartSeller = cartSellerId
    ? state.sellers.find((s) => s.id === cartSellerId)
    : null;
  const sellerIsOpen = cartSeller?.isOpen !== false;
  // Antar ke kelas hanya aktif bila SEMUA produk di keranjang bisa diantar
  const sellerSupportDelivery =
    state.cart.length > 0 &&
    state.cart.every((item) => {
      const p = state.products.find((pp) => pp.id === item.productId);
      return p?.canDeliver === true;
    });
  const sellerDeliveryFee = cartSeller?.deliveryFee || 0;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const buyerName = String(fd.get("buyerName") || "").trim();
    const buyerClass = String(fd.get("buyerClass") || "").trim();
    const buyerPhone = String(fd.get("buyerPhone") || "").trim();
    const notes = String(fd.get("notes") || "").trim();

    if (buyerName.length < 2) {
      toast("Nama wajib diisi", "error");
      return;
    }
    if (!buyerClass) {
      toast("Kelas wajib diisi", "error");
      return;
    }

    setLoading(true);
    try {
      const order = await createPendingOrder({
        buyerName,
        buyerClass,
        buyerPhone,
        notes,
        paymentMethod: payMethod,
        pickupMethod,
      });
      if (!order) {
        setLoading(false);
        return;
      }

      // â€”â€”â€” Bayar di Kantin (COD) â€”â€”â€”
      if (payMethod === "canteen") {
        toast("Pesanan berhasil! Bayar saat ambil di kantin.");
        router.push(
          `/orders?cod=1&order=${encodeURIComponent(order.orderNumber)}`
        );
        return;
      }

      // â€”â€”â€” Bayar Online (Bayar.gg / QRIS) â€” modal di halaman, tidak redirect â€”â€”â€”
      const desc = `Pesanan ${order.orderNumber} â€” ${order.items
        .map((i) => `${i.name} x${i.qty}`)
        .join(", ")}`.slice(0, 120);

      let paymentUrl = "";
      let invoiceId = "";
      let qrisString = "";
      let finalAmount = order.total;

      try {
        const res = await fetch("/api/bayar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.orderNumber,
            amount: order.total,
            customerName: order.buyerName,
            customerPhone: order.buyerPhone || undefined,
            description: desc,
          }),
        });
        const data = await res.json();
        if (res.ok && data.paymentUrl) {
          paymentUrl = data.paymentUrl as string;
          invoiceId = (data.invoiceId as string) || "";
          qrisString = (data.qrisString as string) || "";
          if (data.finalAmount) finalAmount = Number(data.finalAmount);
        } else if (!res.ok) {
          console.warn("[checkout] bayar create", data?.error);
        }
      } catch {
        /* fallback browser */
      }

      if (!paymentUrl) {
        const browserPay = await createBayarPaymentInBrowser({
          amount: order.total,
          description: desc,
          customerName: order.buyerName,
          customerPhone: order.buyerPhone || undefined,
          redirectUrl: `${window.location.origin}/orders?paid=1&order=${encodeURIComponent(order.orderNumber)}`,
        });

        if (!browserPay.success) {
          markOrderPaymentStatus(order.id, "failed");
          toast(
            browserPay.error ||
              "Pembayaran QRIS gagal diproses. Coba lagi atau pilih Bayar di Kantin.",
            "error"
          );
          setLoading(false);
          return;
        }
        paymentUrl = browserPay.paymentUrl;
        invoiceId = browserPay.invoiceId;
        qrisString = browserPay.qrisString || "";
        if (browserPay.finalAmount) finalAmount = browserPay.finalAmount;
      }

      attachBayarPayment(order.id, invoiceId, paymentUrl, finalAmount - order.total);

      try {
        sessionStorage.setItem(
          "kantinku_pending_pay",
          JSON.stringify({
            orderId: order.id,
            orderNumber: order.orderNumber,
            invoiceId,
          })
        );
      } catch {
        /* ignore */
      }

      setQrisPayload({
        orderId: order.id,
        orderNumber: order.orderNumber,
        invoiceId,
        paymentUrl,
        qrisString: qrisString || undefined,
        amount: order.total,
        finalAmount,
      });
      setQrisOpen(true);
      toast(
        qrisString
          ? "Scan QRIS di bawah untuk bayar"
          : "Invoice dibuat â€” tampilkan QRIS"
      );
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast(
        err instanceof Error ? err.message : "Terjadi kesalahan pembayaran",
        "error"
      );
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <Link
            href="/cart"
            className="text-sm font-semibold text-stone-500 transition hover:underline"
          >
            Kembali ke keranjang
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Lengkapi data dan pilih metode pembayaran
          </p>
        </Reveal>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <Reveal delay={0.05}>
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 dark:border-stone-800 dark:bg-[#121a16]">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                Data Pemesan
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                    Nama Lengkap
                  </label>
                  <input
                    name="buyerName"
                    required
                    autoComplete="name"
                    defaultValue={session?.name || ""}
                    className={inputClass}
                    placeholder="Nama siswa"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                    Kelas
                  </label>
                  <input
                    name="buyerClass"
                    required
                    autoComplete="off"
                    defaultValue={
                      session?.kelas && session.kelas !== "-"
                        ? session.kelas
                        : ""
                    }
                    className={inputClass}
                    placeholder="Contoh: XII IPA 2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                    WhatsApp (untuk notifikasi)
                  </label>
                  <input
                    name="buyerPhone"
                    type="tel"
                    autoComplete="tel"
                    defaultValue={session?.phone || ""}
                    className={inputClass}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                    Catatan
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    className={cn(inputClass, "resize-none")}
                    placeholder="Opsional: tidak pedas, tanpa es..."
                  />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 dark:border-stone-800 dark:bg-[#121a16]">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                Metode Pengambilan
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label
                  className={cn(
                    "relative h-full cursor-pointer rounded-2xl border-2 p-4 transition-all",
                    pickupMethod === "takeaway"
                      ? "bg-white/80 dark:bg-white/5"
                      : "border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                  )}
                  style={pickupMethod === "takeaway" ? { borderColor: stallColor.primary } : undefined}
                >
                  <input
                    type="radio"
                    name="pickupMethod"
                    value="takeaway"
                    checked={pickupMethod === "takeaway"}
                    onChange={() => setPickupMethod("takeaway")}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: stallColor.bg, color: stallColor.text }}
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">
                        Ambil Sendiri
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                        Takeaway / Pick-up
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={cn(
                    "relative h-full cursor-pointer rounded-2xl border-2 p-4 transition-all",
                    pickupMethod === "dinein"
                      ? "bg-white/80 dark:bg-white/5"
                      : "border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                  )}
                  style={pickupMethod === "dinein" ? { borderColor: stallColor.primary } : undefined}
                >
                  <input
                    type="radio"
                    name="pickupMethod"
                    value="dinein"
                    checked={pickupMethod === "dinein"}
                    onChange={() => setPickupMethod("dinein")}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <UtensilsCrossed className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">
                        Makan di Tempat
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                        Dine-in
                      </p>
                    </div>
                  </div>
                </label>

                {sellerSupportDelivery ? (
                  <label
                    className={cn(
                      "relative h-full cursor-pointer rounded-2xl border-2 p-4 transition-all",
                      pickupMethod === "delivery"
                        ? "bg-white/80 dark:bg-white/5"
                        : "border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                    )}
                    style={pickupMethod === "delivery" ? { borderColor: stallColor.primary } : undefined}
                  >
                    <input
                      type="radio"
                      name="pickupMethod"
                      value="delivery"
                      checked={pickupMethod === "delivery"}
                      onChange={() => setPickupMethod("delivery")}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={pickupMethod === "delivery" ? { backgroundColor: stallColor.primary, color: "#fff" } : { backgroundColor: stallColor.bg, color: stallColor.text }}
                      >
                        <Truck className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-stone-900 dark:text-white">
                          Antar ke Kelas
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                          +{formatRupiah(sellerDeliveryFee)}
                        </p>
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="h-full cursor-not-allowed rounded-2xl border-2 border-stone-200 p-4 opacity-60 dark:border-stone-700">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
                        <Truck className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-stone-900 dark:text-white">
                          Antar ke Kelas
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                          Gerai ini belum support mengantarkan makanan ke kelas
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {pickupMethod === "takeaway" && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                    Jam Pengambilan
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <select
                      name="pickupTime"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className={cn(inputClass, "pl-10")}
                    >
                      <option value="">Pilih jam...</option>
                      {getPickupTimeOptions().map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {pickupMethod === "dinein" && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-xs font-bold text-stone-600 dark:text-stone-400">
                    Nomor Meja / Area
                  </label>
                  <input
                    name="tableNumber"
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className={inputClass}
                    placeholder="Contoh: Meja 3 / Area Taman"
                  />
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 dark:border-stone-800 dark:bg-[#121a16]">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                Metode Pembayaran
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label
                  className={cn(
                    "relative cursor-pointer rounded-2xl border-2 p-4 transition-all",
                    payMethod === "canteen"
                      ? "bg-white/80 dark:bg-white/5"
                      : "border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                  )}
                  style={payMethod === "canteen" ? { borderColor: stallColor.primary } : undefined}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="canteen"
                    checked={payMethod === "canteen"}
                    onChange={() => setPayMethod("canteen")}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <Store className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">
                        Bayar di Kantin
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                        Pesanan masuk ke antrean. Bayar tunai/cash saat ambil
                        makanan di counter.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={cn(
                    "relative cursor-pointer rounded-2xl border-2 p-4 transition-all",
                    payMethod === "online"
                      ? "bg-white/80 dark:bg-white/5"
                      : "border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                  )}
                  style={payMethod === "online" ? { borderColor: stallColor.primary } : undefined}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={payMethod === "online"}
                    onChange={() => setPayMethod("online")}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      <QrCode className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-stone-900 dark:text-white">
                        QRIS / Online
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                        QRIS muncul di sini — scan langsung tanpa pindah
                        halaman.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 dark:border-stone-800 dark:bg-[#121a16]">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                Ringkasan
              </h2>
              <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
                {state.cart.map((item) => (
                  <li
                    key={`${item.productId}::${item.variantId}`}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span className="text-stone-700 dark:text-stone-200">
                      {item.name}{" "}
                      <span className="text-stone-400">x{item.qty}</span>
                    </span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {formatRupiah(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm dark:border-stone-800">
                {pickupMethod === "delivery" && sellerSupportDelivery && (
                  <div className="flex justify-between text-stone-500 dark:text-stone-400">
                    <span>Ongkir antar ke kelas</span>
                    <span>{formatRupiah(sellerDeliveryFee)}</span>
                  </div>
                )}
                {payMethod === "online" && (
                  <div className="flex justify-between text-stone-500 dark:text-stone-400">
                    <span>Biaya admin QRIS</span>
                    <span className="text-xs italic">(dihitung setelah bayar)</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-base font-bold text-stone-900 dark:text-white">
                  <span>Total bayar</span>
                  <span style={{ color: stallColor.text }}>
                    {formatRupiah(cartSubtotal + (pickupMethod === "delivery" && sellerSupportDelivery ? sellerDeliveryFee : 0))}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {payMethod === "online" && (
            <Reveal delay={0.12}>
              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: stallColor.border,
                  backgroundColor: stallColor.bg,
                }}
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: stallColor.text }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: stallColor.text }}>
                      QRIS di halaman ini
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-white/50">
                      Setelah klik bayar, kode QRIS muncul di popup — scan
                      dengan e-wallet / m-banking. Status dicek otomatis.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {payMethod === "canteen" && (
            <Reveal delay={0.12}>
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <Store className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Bayar saat ambil di kantin
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800/80 dark:text-amber-300/70">
                      Simpan nomor pesanan. Tunjukkan ke petugas kantin dan
                      bayar di tempat. Stok langsung dipesan untuk Anda.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          <Reveal delay={0.15}>
            <button
              type="submit"
              disabled={loading || !sellerIsOpen}
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-white shadow-soft transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: stallColor.primary }}
            >
              {!sellerIsOpen ? (
                "Gerai Sedang Tutup"
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : payMethod === "canteen" ? (
                <>
                  <Store className="h-4 w-4" />
                  Buat Pesanan · {formatRupiah(cartSubtotal + (pickupMethod === "delivery" && sellerSupportDelivery ? sellerDeliveryFee : 0))}
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  Tampilkan QRIS · {formatRupiah(cartSubtotal + (pickupMethod === "delivery" && sellerSupportDelivery ? sellerDeliveryFee : 0))}
                </>
              )}
            </button>
          </Reveal>
        </form>
      </div>

      <QrisPayModal
        open={qrisOpen}
        payload={qrisPayload}
        onClose={() => {
          setQrisOpen(false);
          router.push("/orders");
        }}
        onPaid={handleQrisPaid}
      />
    </PageTransition>
  );
}
