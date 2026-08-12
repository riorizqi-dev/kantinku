"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  getActiveVariants,
  getProductMinPrice,
  getVariantImage,
  hasPriceRange,
  isProductOutOfStock,
} from "@/lib/product";
import { formatRupiah, cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductQuickView({
  product,
  sellerName,
  open,
  onClose,
}: {
  product: Product;
  sellerName?: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { addToCart } = useApp();
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState(1);

  const variants = useMemo(() => getActiveVariants(product), [product]);
  const selected = useMemo(
    () => variants.find((v) => v.id === variantId) || variants[0],
    [variants, variantId]
  );

  const out = isProductOutOfStock(product) || !selected || selected.stock <= 0;
  const displayImage = getVariantImage(product, selected);
  const displayPrice = selected?.price ?? getProductMinPrice(product);
  const maxQty = Math.max(selected?.stock ?? 0, 0);
  const priceRange = hasPriceRange(product);

  // Reset ke varian pertama yang masih stok setiap kali dibuka
  useEffect(() => {
    if (!open) return;
    const preferred =
      variants.find((v) => v.stock > 0)?.id || variants[0]?.id || "";
    setVariantId((prev) =>
      prev && variants.some((v) => v.id === prev) ? prev : preferred
    );
    setQty(1);
  }, [open, variants]);

  // Tutup dengan Esc + kunci scroll halaman
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  function clampQty(n: number) {
    if (maxQty <= 0) return 1;
    return Math.min(Math.max(1, n), maxQty);
  }

  function pickVariant(id: string) {
    setVariantId(id);
    setQty(1);
  }

  function handleAdd() {
    if (out || !selected) return;
    addToCart(product.id, selected.id, clampQty(qty));
    onClose();
  }

  function handleBuyNow() {
    if (out || !selected) return;
    addToCart(product.id, selected.id, clampQty(qty));
    onClose();
    router.push("/cart");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quickview-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#121214] sm:rounded-3xl"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-stone-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/[0.06] dark:bg-[#121214]/95">
              <div className="min-w-0">
                <h2
                  id="quickview-title"
                  className="truncate text-base font-semibold text-stone-900 dark:text-white"
                >
                  {product.name}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500 dark:text-white/40">
                  {sellerName ? (
                    <>
                      <Store className="h-3 w-3" strokeWidth={1.75} />
                      <span className="truncate">{sellerName}</span>
                      <span className="text-stone-300 dark:text-white/20">·</span>
                    </>
                  ) : null}
                  {product.category}
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
              <div className="relative aspect-[16/10] shrink-0 overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-800">
                <Image
                  src={displayImage}
                  alt={selected?.name || product.name}
                  fill
                  sizes="(max-width:640px) 100vw, 28rem"
                  className="object-cover object-center"
                  unoptimized
                />
                {out && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="rounded bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                      Habis
                    </span>
                  </span>
                )}
              </div>

              {/* Harga */}
              <p
                className="mt-4 flex min-w-0 flex-wrap items-baseline gap-x-1 tabular-nums text-[#FFB300]"
                aria-label={formatRupiah(displayPrice)}
              >
                <span className="shrink-0 text-sm font-medium tracking-[0.02em] text-[#FFB300]/75">
                  Rp
                </span>
                <span className="break-all text-2xl font-semibold leading-tight tracking-[-0.03em]">
                  {Number(displayPrice || 0).toLocaleString("id-ID")}
                </span>
              </p>
              {priceRange && !selected && (
                <p className="mt-1 text-xs text-stone-400 dark:text-white/35">
                  Mulai dari {formatRupiah(getProductMinPrice(product))}
                </p>
              )}

              {/* Pilih varian */}
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
                  Pilih Varian
                  {variants.length > 1 ? ` (${variants.length})` : ""}
                </h3>
                {variants.length === 0 ? (
                  <p className="mt-2 text-sm text-stone-500 dark:text-white/40">
                    Tidak ada varian tersedia.
                  </p>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {variants.map((v) => {
                      const active = v.id === selected?.id;
                      const vOut = v.stock <= 0;
                      const thumb = getVariantImage(product, v);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={vOut}
                          onClick={() => pickVariant(v.id)}
                          className={cn(
                            "inline-flex w-full items-center gap-2.5 rounded-2xl border py-2 pl-2 pr-3.5 text-left transition-colors duration-200",
                            active
                              ? "border-[#FFB300]/50 bg-[#FFB300]/10 ring-1 ring-[#FFB300]/30"
                              : "border-stone-200 bg-stone-50 hover:border-stone-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/15",
                            vOut && "cursor-not-allowed opacity-45"
                          )}
                        >
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-stone-200 dark:bg-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover object-center"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-900 dark:text-white">
                              {active && (
                                <Check
                                  className="h-3.5 w-3.5 shrink-0 text-[#FFB300]"
                                  strokeWidth={2.5}
                                />
                              )}
                              <span className="line-clamp-1">{v.name}</span>
                            </span>
                            <span className="mt-0.5 block break-words text-xs font-medium text-[#996A00]">
                              <span className="whitespace-nowrap">
                                {formatRupiah(v.price)}
                              </span>
                              <span className="ml-1.5 font-normal text-stone-400 dark:text-white/35">
                                · {vOut ? "Habis" : `Stok ${v.stock}`}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!out && (
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-white/40">
                    Jumlah
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 p-1 dark:border-white/10 dark:bg-white/[0.03]">
                      <button
                        type="button"
                        onClick={() => setQty((q) => clampQty(q - 1))}
                        disabled={qty <= 1}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-200/80 disabled:opacity-30 dark:text-white/70 dark:hover:bg-white/10"
                        aria-label="Kurangi"
                      >
                        <Minus className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <span className="min-w-[2.5rem] text-center text-sm font-semibold text-stone-900 dark:text-white">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => clampQty(q + 1))}
                        disabled={qty >= maxQty}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-200/80 disabled:opacity-30 dark:text-white/70 dark:hover:bg-white/10"
                        aria-label="Tambah"
                      >
                        <Plus className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                    <span className="text-xs text-stone-400 dark:text-white/30">
                      maks. {maxQty}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 border-t border-stone-100 bg-white/95 p-4 backdrop-blur dark:border-white/[0.06] dark:bg-[#121214]/95">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <span className="text-xs text-stone-500 dark:text-white/40">
                  Total
                </span>
                <span
                  className="text-lg font-semibold tabular-nums text-[#FFB300]"
                  aria-label={formatRupiah(displayPrice * Math.max(1, qty))}
                >
                  Rp{" "}
                  {Number(displayPrice * Math.max(1, qty)).toLocaleString(
                    "id-ID"
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={out || !selected}
                  onClick={handleAdd}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
                    out
                      ? "cursor-not-allowed bg-stone-100 text-stone-400 dark:bg-white/[0.06] dark:text-white/30"
                      : "bg-[#FFB300] text-white hover:bg-[#F0A500]"
                  )}
                  style={
                    out
                      ? undefined
                      : {
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                        }
                  }
                >
                  {out ? (
                    <>
                      <Ban className="h-4 w-4" strokeWidth={1.75} />
                      Stok Habis
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />
                      Tambah ke Keranjang
                    </>
                  )}
                </button>
                {!out && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white py-3.5 text-sm font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98] dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:border-white/25 dark:hover:bg-white/[0.08]"
                  >
                    <Zap className="h-4 w-4" strokeWidth={1.75} />
                    Beli Sekarang
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
