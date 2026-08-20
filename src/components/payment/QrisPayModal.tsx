"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { formatRupiah, cn } from "@/lib/utils";

export type QrisPayPayload = {
  orderId: string;
  orderNumber: string;
  invoiceId: string;
  paymentUrl: string;
  qrisString?: string;
  qrDataUrl?: string;
  amount: number;
  finalAmount?: number;
};

type Props = {
  open: boolean;
  payload: QrisPayPayload | null;
  onClose: () => void;
  onPaid: (invoiceId: string) => void;
};

function qrisImageUrl(qris: string, size = 280) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(qris)}`;
}

export function QrisPayModal({ open, payload, onClose, onPaid }: Props) {
  const [status, setStatus] = useState<"pending" | "paid" | "expired" | "error">(
    "pending"
  );
  const [checking, setChecking] = useState(false);
  const [ticks, setTicks] = useState(0);
  const paidOnce = useRef(false);

  const amount = payload?.finalAmount ?? payload?.amount ?? 0;
  const hasQris = Boolean(
    payload?.qrDataUrl ||
      (payload?.qrisString && payload.qrisString.length > 20)
  );

  const imgSrc = useMemo(() => {
    if (payload?.qrDataUrl) return payload.qrDataUrl;
    if (!payload?.qrisString) return "";
    return qrisImageUrl(payload.qrisString, 300);
  }, [payload?.qrDataUrl, payload?.qrisString]);

  useEffect(() => {
    if (!open || !payload?.invoiceId) return;
    setStatus("pending");
    paidOnce.current = false;
    setTicks(0);

    let cancelled = false;

    async function poll() {
      if (cancelled || !payload?.invoiceId) return;
      setChecking(true);
      try {
        const res = await fetch(
          `/api/bayar/check?invoice=${encodeURIComponent(payload.invoiceId)}`
        );
        const data = await res.json();
        if (!res.ok) return;
        const st = String(data.status || "").toLowerCase();
        if (st === "paid") {
          setStatus("paid");
          if (!paidOnce.current) {
            paidOnce.current = true;
            onPaid(payload.invoiceId);
          }
        } else if (st === "expired" || st === "cancelled") {
          setStatus(st === "expired" ? "expired" : "error");
        } else {
          setStatus("pending");
        }
      } catch {
        /* ignore network blip */
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void poll();
    const iv = setInterval(() => {
      setTicks((t) => t + 1);
      void poll();
    }, 3500);

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [open, payload?.invoiceId, onPaid]);

  if (!open || !payload) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qris-pay-title"
    >
      <div className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-stone-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#121214] sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/[0.06] dark:bg-[#121214]/95">
          <div>
            <p
              id="qris-pay-title"
              className="text-base font-semibold text-stone-900 dark:text-white"
            >
              Bayar dengan QRIS
            </p>
            <p className="text-xs text-stone-500 dark:text-white/40">
              {payload.orderNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 dark:hover:bg-white/10"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 py-6">
          {status === "paid" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-14 w-14 text-kantin-500" strokeWidth={1.5} />
              <p className="mt-4 text-lg font-semibold text-stone-900 dark:text-white">
                Pembayaran berhasil!
              </p>
              <p className="mt-1 text-sm text-stone-500 dark:text-white/45">
                Pesanan dikirim ke kantin. Mengalihkan...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-white/35">
                  Total bayar
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[#059669] dark:text-[#10b981]">
                  {formatRupiah(amount)}
                </p>
                {payload?.finalAmount && payload.finalAmount > (payload.amount || 0) && (
                  <p className="mt-1 text-[11px] text-stone-400 dark:text-white/30">
                    Harga: {formatRupiah(payload.amount || 0)} + Biaya admin: {formatRupiah(payload.finalAmount - (payload.amount || 0))}
                  </p>
                )}
              </div>

              <div className="mx-auto mt-5 flex w-fit flex-col items-center rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/30">
                {hasQris && imgSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgSrc}
                    alt="QRIS pembayaran"
                    width={280}
                    height={280}
                    className="h-[260px] w-[260px] rounded-lg bg-white object-contain sm:h-[280px] sm:w-[280px]"
                  />
                ) : (
                  <div className="flex h-[260px] w-[260px] flex-col items-center justify-center gap-3 rounded-lg bg-stone-50 px-4 text-center dark:bg-white/[0.03] sm:h-[280px] sm:w-[280px]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#059669]" />
                    <p className="text-xs text-stone-500">
                      QR tidak tersedia di respons. Buka halaman pembayaran.
                    </p>
                    {payload.paymentUrl && (
                      <a
                        href={payload.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#047857] dark:text-[#10b981]"
                      >
                        Buka halaman bayar <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <p className="mt-4 text-center text-sm text-stone-600 dark:text-white/55">
                Scan QRIS pakai GoPay, OVO, DANA, ShopeePay, m-banking, dll.
              </p>

              <div
                className={cn(
                  "mt-4 flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold",
                  status === "expired"
                    ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                    : "bg-stone-100 text-stone-600 dark:bg-white/[0.06] dark:text-white/55"
                )}
              >
                {status === "expired" ? (
                  "Pembayaran kedaluwarsa"
                ) : (
                  <>
                    <RefreshCw
                      className={cn("h-3.5 w-3.5", checking && "animate-spin")}
                      strokeWidth={2}
                    />
                    Menunggu pembayaran
                    {ticks > 0 ? ` · cek otomatis` : ""}
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                {payload.paymentUrl && (
                  <a
                    href={payload.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[0.04]"
                  >
                    <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                    Buka halaman pembayaran
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full py-2.5 text-sm font-semibold text-stone-500 transition hover:text-stone-800 dark:text-white/45 dark:hover:text-white"
                >
                  Bayar nanti · cek di Riwayat Pesanan
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
