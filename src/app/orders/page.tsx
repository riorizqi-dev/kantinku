"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Receipt,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Star,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  formatDate,
  formatRupiah,
  orderStatusLabel,
  paymentStatusLabel,
  paymentMethodLabel,
  cn,
} from "@/lib/utils";
import { openOrderWhatsAppToSeller } from "@/lib/whatsapp";
import { PageTransition, Reveal } from "@/components/motion/Reveal";
import { Avatar } from "@/components/profile/Avatar";
import type { Order } from "@/lib/types";

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "emerald" | "amber" | "stone" | "red" | "sky";
}) {
  const map = {
    emerald:
      "bg-kantin-100 text-kantin-800 dark:bg-kantin-900/40 dark:text-kantin-300",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    stone:
      "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    sky: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${map[tone]}`}
    >
      {label}
    </span>
  );
}

function paymentTone(status: Order["paymentStatus"]) {
  if (status === "paid") return "emerald" as const;
  if (status === "pending") return "amber" as const;
  if (status === "failed" || status === "expired") return "red" as const;
  return "stone" as const;
}

function orderTone(status: Order["status"]) {
  if (status === "completed" || status === "ready") return "emerald" as const;
  if (status === "processing") return "sky" as const;
  if (status === "cancelled") return "red" as const;
  return "amber" as const;
}

function StoreRatingBlock({
  order,
  onRate,
}: {
  order: Order;
  onRate: (orderId: string, stars: number, comment?: string) => string | null;
}) {
  const [hover, setHover] = useState(0);
  const [picked, setPicked] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (order.status !== "completed") return null;

  if (order.rating) {
    return (
      <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/70 dark:text-amber-200/60">
          Rating toko Anda
        </p>
        <div className="mt-1.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                "h-4 w-4",
                n <= (order.rating || 0)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-stone-200 text-stone-200 dark:fill-white/10 dark:text-white/10"
              )}
              strokeWidth={0}
            />
          ))}
          <span className="ml-1.5 text-sm font-semibold text-amber-900 dark:text-amber-100">
            {order.rating}/5
          </span>
        </div>
        {order.ratingComment && (
          <p className="mt-1.5 text-xs leading-relaxed text-amber-900/70 dark:text-amber-100/60">
            â€œ{order.ratingComment}â€
          </p>
        )}
      </div>
    );
  }

  function submit() {
    if (!picked) return;
    setBusy(true);
    onRate(order.id, picked, comment);
    setBusy(false);
  }

  return (
    <div className="mt-3 rounded-xl border border-[#FFB300]/25 bg-[#FFB300]/05 px-3.5 py-3 dark:border-[#FFB300]/25 dark:bg-[#FFB300]/08">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F0A500]/80 dark:text-[#FFC107]/80">
        Bagaimana pengalaman di {order.sellerName}?
      </p>
      <p className="mt-0.5 text-xs text-stone-500 dark:text-white/40">
        Beri rating toko setelah pesanan selesai
      </p>
      <div className="mt-2.5 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= (hover || picked);
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setPicked(n)}
              className="rounded-md p-0.5 transition hover:scale-110"
              aria-label={`${n} bintang`}
            >
              <Star
                className={cn(
                  "h-7 w-7 transition",
                  on
                    ? "fill-amber-400 text-amber-400"
                    : "fill-stone-200 text-stone-300 dark:fill-white/10 dark:text-white/20"
                )}
                strokeWidth={on ? 0 : 1.25}
              />
            </button>
          );
        })}
        {picked > 0 && (
          <span className="ml-2 text-sm font-semibold text-stone-700 dark:text-white/80">
            {picked}/5
          </span>
        )}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 280))}
        placeholder="Komentar opsional (maks. 280 karakter)"
        rows={2}
        className="mt-2.5 w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:border-[#FFB300]/50 focus:outline-none focus:ring-2 focus:ring-[#FFB300]/15 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
      />
      <button
        type="button"
        disabled={!picked || busy}
        onClick={submit}
        className="mt-2 inline-flex cursor-pointer items-center rounded-full bg-[#FFB300] px-4 py-2 text-xs font-bold text-[#1c1917] transition hover:bg-[#F0A500] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Kirim rating
      </button>
    </div>
  );
}

export default function OrdersPage() {
  const {
    ready,
    state,
    toast,
    markOrderPaid,
    markOrderPaidByInvoice,
    rateOrder,
  } = useApp();
  const session = state.session;
  const searchParams = useSearchParams();
  const polled = useRef(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  /** Setelah kembali dari pembayaran, cek status invoice */
  useEffect(() => {
    if (!ready || polled.current) return;

    const paidFlag = searchParams.get("paid");
    const orderNumber = searchParams.get("order");
    const invoiceQ = searchParams.get("invoice");

    let pending: {
      orderId?: string;
      orderNumber?: string;
      invoiceId?: string;
    } | null = null;
    try {
      const raw = sessionStorage.getItem("kantinku_pending_pay");
      if (raw) pending = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    const invoiceId =
      invoiceQ ||
      pending?.invoiceId ||
      state.orders.find((o) => o.orderNumber === orderNumber)?.bayarInvoiceId ||
      state.orders.find((o) => o.id === pending?.orderId)?.bayarInvoiceId;

    if (!invoiceId && !paidFlag && !pending) return;

    polled.current = true;

    async function syncPayment() {
      if (!invoiceId) return;
      try {
        const res = await fetch(
          `/api/bayar/check?invoice=${encodeURIComponent(invoiceId)}`
        );
        const data = await res.json();
        if (res.ok && String(data.status).toLowerCase() === "paid") {
          const byInvoice = markOrderPaidByInvoice(invoiceId);
          if (!byInvoice && pending?.orderId) {
            markOrderPaid(pending.orderId, invoiceId);
          }
          try {
            sessionStorage.removeItem("kantinku_pending_pay");
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore network */
      }
    }

    void syncPayment();
  }, [
    ready,
    searchParams,
    state.orders,
    markOrderPaid,
    markOrderPaidByInvoice,
  ]);

  async function checkPayment(order: Order) {
    if (!order.bayarInvoiceId) {
      toast("Invoice pembayaran tidak ditemukan", "warning");
      return;
    }
    setCheckingId(order.id);
    try {
      const res = await fetch(
        `/api/bayar/check?invoice=${encodeURIComponent(order.bayarInvoiceId)}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Gagal cek status", "error");
        return;
      }
      const st = String(data.status || "").toLowerCase();
      if (st === "paid") {
        markOrderPaid(order.id, order.bayarInvoiceId);
      } else if (st === "expired") {
        toast("Pembayaran kedaluwarsa", "warning");
      } else {
        toast(`Status: ${st || "pending"}`, "info");
      }
    } catch {
      toast("Gagal menghubungi server pembayaran", "error");
    } finally {
      setCheckingId(null);
    }
  }

  const orders = useMemo(() => {
    let list = state.orders;
    if (session?.role === "buyer") {
      list = list.filter(
        (o) => o.buyerId === session.id || o.buyerName === session.name
      );
    } else if (
      session?.role === "seller" ||
      session?.role === "admin" ||
      session?.role === "superadmin"
    ) {
      // Staff: riwayat di sini hanya pesanan pribadi (jika ada).
      // Semua pesanan platform ada di dashboard masing-masing.
      list = list.filter((o) => o.buyerId === session.id);
    } else {
      // Guest: pesanan tanpa akun di perangkat ini
      list = list.filter((o) => !o.buyerId);
    }
    return list;
  }, [state.orders, session]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-[#FFB300]" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
            Riwayat Pesanan
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {session
              ? `Pesanan untuk ${session.name}`
              : "Pesanan tamu di perangkat ini"}
          </p>
        </Reveal>

        {!orders.length ? (
          <Reveal delay={0.1}>
            <div className="mt-20 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
                <Receipt className="h-7 w-7 text-stone-400" />
              </div>
              <p className="font-semibold text-stone-800 dark:text-stone-100">
                Belum ada pesanan
              </p>
              <Link
                href="/"
                className="mt-5 rounded-full bg-[#FFB300] px-5 py-2.5 text-sm font-bold text-[#1c1917] transition hover:bg-[#F0A500]"
              >
                Lihat Menu
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((o, i) => (
              <Reveal key={o.id} delay={i * 0.04}>
                <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md dark:border-stone-800 dark:bg-[#121a16]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={o.sellerName}
                        avatar={
                          o.sellerAvatar ||
                          state.users.find(
                            (u) =>
                              u.sellerId === o.sellerId ||
                              state.sellers.find((s) => s.id === o.sellerId)
                                ?.ownerUserId === u.id
                          )?.avatar
                        }
                        size="md"
                      />
                      <div>
                        <p className="font-bold text-stone-900 dark:text-white">
                          {o.orderNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500 dark:text-white/45">
                          {formatDate(o.createdAt)} Â·{" "}
                          <span className="font-semibold text-stone-700 dark:text-white/75">
                            {o.sellerName}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusPill
                        label={paymentMethodLabel(o.paymentMethod)}
                        tone={
                          o.paymentMethod === "canteen" ? "amber" : "sky"
                        }
                      />
                      <StatusPill
                        label={paymentStatusLabel(o.paymentStatus)}
                        tone={paymentTone(o.paymentStatus)}
                      />
                      <StatusPill
                        label={orderStatusLabel(o.status)}
                        tone={orderTone(o.status)}
                      />
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-stone-600 dark:text-stone-300">
                    {o.items.map((it) => (
                      <li
                        key={
                          (it.variantId || it.productId) + it.name
                        }
                        className="flex justify-between gap-2"
                      >
                        <span>
                          {it.name}{" "}
                          <span className="text-stone-400">x{it.qty}</span>
                        </span>
                        <span className="font-semibold">
                          {formatRupiah(it.price * it.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <StoreRatingBlock
                    order={o}
                    onRate={(orderId, stars, comment) => {
                      const err = rateOrder(orderId, stars, comment);
                      if (err) toast(err, "error");
                      return err;
                    }}
                  />

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3 dark:border-stone-800">
                    <p className="text-base font-bold text-[#F0A500] dark:text-[#FFC107]">
                      {formatRupiah(o.total)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {o.paymentStatus !== "paid" && o.bayarPaymentUrl && (
                        <a
                          href={o.bayarPaymentUrl}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#FFB300] px-3 py-1.5 text-xs font-bold text-[#1c1917] transition hover:bg-[#F0A500]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Lanjut Bayar
                        </a>
                      )}
                      {o.paymentStatus !== "paid" && o.bayarInvoiceId && (
                        <button
                          type="button"
                          onClick={() => checkPayment(o)}
                          disabled={checkingId === o.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${checkingId === o.id ? "animate-spin" : ""}`}
                          />
                          Cek Status
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            // Kirim ke NOMOR PENJUAL, bukan nomor customer
                            openOrderWhatsAppToSeller({
                              order: o,
                              sellers: state.sellers,
                              settings: state.settings,
                            });
                          } catch (e) {
                            toast(
                              e instanceof Error
                                ? e.message
                                : "Gagal buka WhatsApp",
                              "error"
                            );
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-3 py-1.5 text-xs font-bold text-[#128C7E] transition hover:bg-[#25D366]/25 dark:text-[#25D366]"
                        title="Kirim ringkasan pesanan ke WhatsApp penjual"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Kirim ke
                        Penjual
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
