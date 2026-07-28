"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Package,
  Ban,
  Store,
  Check,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Avatar } from "@/components/profile/Avatar";
import { PageTransition, Reveal } from "@/components/motion/Reveal";
import { formatRupiah, cn } from "@/lib/utils";
import {
  getActiveVariants,
  getProductMinPrice,
  getVariantImage,
  hasPriceRange,
  isProductOutOfStock,
} from "@/lib/product";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const { state, addToCart } = useApp();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [variantId, setVariantId] = useState<string>("");

  const product = useMemo(
    () => state.products.find((p) => p.id === id && p.isActive),
    [state.products, id]
  );

  const variants = useMemo(
    () => (product ? getActiveVariants(product) : []),
    [product]
  );

  // Default: varian pertama yang masih stok, atau pertama
  useEffect(() => {
    if (!product) return;
    const preferred =
      variants.find((v) => v.stock > 0)?.id || variants[0]?.id || "";
    setVariantId((prev) => {
      if (prev && variants.some((v) => v.id === prev)) return prev;
      return preferred;
    });
    setQty(1);
  }, [product, variants]);

  const selected = useMemo(
    () => variants.find((v) => v.id === variantId) || variants[0],
    [variants, variantId]
  );

  const seller = useMemo(
    () =>
      product
        ? state.sellers.find((s) => s.id === product.sellerId)
        : undefined,
    [state.sellers, product]
  );

  const owner = useMemo(() => {
    if (!product) return undefined;
    return state.users.find(
      (u) =>
        u.role === "seller" &&
        (u.sellerId === product.sellerId ||
          (seller && u.id === seller.ownerUserId))
    );
  }, [state.users, product, seller]);

  const related = useMemo(() => {
    if (!product) return [];
    return state.products
      .filter(
        (p) =>
          p.isActive &&
          p.id !== product.id &&
          p.sellerId === product.sellerId
      )
      .slice(0, 4);
  }, [state.products, product]);

  if (!product) {
    return (
      <PageTransition>
        <div className="mx-auto flex min-h-[60dvh] max-w-[1440px] flex-col items-center justify-center px-4 py-20 text-center">
          <Package
            className="mb-4 h-10 w-10 text-stone-300 dark:text-white/25"
            strokeWidth={1.5}
          />
          <h1 className="text-xl font-semibold text-stone-900 dark:text-white">
            Produk tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-white/40">
            Menu mungkin sudah dihapus atau tidak aktif.
          </p>
          <Link
            href="/#menu"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-[#04140e] transition hover:bg-[#0ea572]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Kembali ke Menu
          </Link>
        </div>
      </PageTransition>
    );
  }

  const productOut = isProductOutOfStock(product);
  const out = !selected || selected.stock <= 0;
  const displayImage = getVariantImage(product, selected);
  const displayPrice = selected?.price ?? getProductMinPrice(product);
  const maxQty = Math.max(selected?.stock ?? 0, 0);
  const rating = seller?.rating ?? 4.5;
  const reviewCount = seller?.reviewCount ?? 0;
  const stallName = seller?.name || "Lapak Kantin";
  const ownerName = owner?.name || stallName;
  const priceRange = hasPriceRange(product);

  function clampQty(n: number) {
    if (maxQty <= 0) return 1;
    return Math.min(Math.max(1, n), maxQty);
  }

  function handleAddToCart() {
    if (out || !selected) return;
    setAdding(true);
    addToCart(product!.id, selected.id, clampQty(qty));
    setAdding(false);
  }

  function handleOrderNow() {
    if (out || !selected) return;
    handleAddToCart();
    router.push("/cart");
  }

  function pickVariant(id: string) {
    setVariantId(id);
    setQty(1);
  }

  return (
    <PageTransition>
      <div className="bg-stone-100 pb-24 pt-6 dark:bg-[#0a0a0b] sm:pb-16 sm:pt-8">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10">
          <Reveal>
            <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-stone-400 dark:text-white/40">
              <Link
                href="/#menu"
                className="inline-flex items-center gap-1.5 font-medium text-stone-600 transition hover:text-stone-900 dark:text-white/55 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                Menu
              </Link>
              <span className="text-stone-300 dark:text-white/20">/</span>
              <span className="truncate text-stone-700 dark:text-white/70">
                {product.name}
              </span>
            </nav>
          </Reveal>

          <Reveal delay={0.04}>
            <div className="overflow-hidden rounded-[1.75rem] border border-stone-200/90 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0e0e10] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
              <div className="grid lg:grid-cols-2 lg:items-stretch">
                {/*
                  Galeri: aspect ratio tetap (4:3), object-contain biar tidak ngezoom/terpotong.
                  Ganti varian → ganti src + fade.
                */}
                <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-stone-100 bg-stone-100 dark:border-white/[0.06] dark:bg-[#121214] lg:aspect-auto lg:min-h-[420px] lg:border-b-0 lg:border-r dark:lg:border-white/[0.06]">
                  {/* Soft plate behind contain image */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
                    style={{
                      backgroundImage:
                        "radial-gradient(ellipse at 50% 45%, rgba(16,185,129,0.08), transparent 65%)",
                    }}
                    aria-hidden
                  />

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${selected?.id || "main"}::${displayImage}`}
                      className="absolute inset-0 flex items-center justify-center p-3 sm:p-5 lg:p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {/* relative box keeps Next/Image fill inside a stable frame */}
                      <div className="relative h-full w-full">
                        <Image
                          src={displayImage}
                          alt={selected?.name || product.name}
                          fill
                          priority
                          sizes="(max-width:1024px) 100vw, 50vw"
                          className="object-contain object-center"
                          unoptimized
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                    <span className="rounded-full border border-black/10 bg-black/55 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md">
                      {product.category}
                    </span>
                    {out || productOut ? (
                      <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur-md">
                        Habis
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-[#04140e]">
                        Stok {selected?.stock ?? 0}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400 dark:text-white/35">
                      Detail Produk
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-900 dark:text-white sm:text-3xl">
                      {product.name}
                    </h1>
                    {selected && variants.length > 1 && (
                      <p className="mt-1 text-sm font-medium text-stone-500 dark:text-white/45">
                        {selected.name}
                      </p>
                    )}

                    <p
                      className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 tabular-nums text-emerald-600 dark:text-[#34d399]"
                      aria-label={formatRupiah(displayPrice)}
                    >
                      <span className="shrink-0 text-sm font-medium tracking-[0.02em] text-emerald-600/75 dark:text-[#34d399]/75 sm:text-base">
                        Rp
                      </span>
                      <span className="break-all text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-[28px]">
                        {Number(displayPrice || 0).toLocaleString("id-ID")}
                      </span>
                    </p>
                    {priceRange && !selected && (
                      <p className="mt-1 text-xs text-stone-400">
                        Mulai dari {formatRupiah(getProductMinPrice(product))}
                      </p>
                    )}

                    {/* Pilih varian */}
                    <div className="mt-6">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
                        Pilih Varian
                        {variants.length > 1
                          ? ` (${variants.length})`
                          : ""}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
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
                                "inline-flex max-w-full items-center gap-2.5 rounded-2xl border py-2 pl-2 pr-3.5 text-left transition-colors duration-200",
                                active
                                  ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30 dark:border-[#10B981]/45 dark:bg-[#10B981]/12 dark:ring-[#10B981]/25"
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
                              <span className="min-w-0">
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-900 dark:text-white">
                                  {active && (
                                    <Check
                                      className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-[#34d399]"
                                      strokeWidth={2.5}
                                    />
                                  )}
                                  <span className="line-clamp-1">{v.name}</span>
                                </span>
                                <span className="mt-0.5 block break-words text-xs font-medium text-emerald-700 dark:text-[#34d399]">
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
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/70">
                        <Package
                          className="h-3.5 w-3.5 text-stone-400 dark:text-white/40"
                          strokeWidth={1.5}
                        />
                        {out
                          ? "Stok habis"
                          : `${selected?.stock ?? 0} tersisa`}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/70">
                        {product.category}
                      </span>
                    </div>

                    <div className="mt-6">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
                        Deskripsi
                      </h2>
                      <p className="mt-2 text-[15px] leading-relaxed text-stone-600 dark:text-white/60">
                        {product.description || "Tidak ada deskripsi."}
                      </p>
                    </div>

                    <div className="mt-7 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.03] sm:p-5">
                      <div className="flex items-start gap-3.5">
                        <Avatar
                          name={ownerName}
                          avatar={owner?.avatar}
                          size="lg"
                          className="ring-stone-200 dark:ring-white/15"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
                            <Store className="h-3 w-3" strokeWidth={1.75} />
                            Penjual / Lapak
                          </div>
                          <p className="mt-1 truncate text-base font-semibold text-stone-900 dark:text-white">
                            {stallName}
                          </p>
                          <p className="truncate text-sm text-stone-500 dark:text-white/45">
                            {ownerName}
                            {seller?.booth ? ` · Booth ${seller.booth}` : ""}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                              <Star
                                className="h-3.5 w-3.5 fill-amber-500 text-amber-500 dark:fill-amber-300 dark:text-amber-300"
                                strokeWidth={0}
                              />
                              {rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-white/40">
                              {reviewCount > 0
                                ? `dari ${reviewCount.toLocaleString("id-ID")} ulasan`
                                : "Belum ada ulasan"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-stone-100 pt-6 dark:border-white/[0.06]">
                    {!out && (
                      <div className="mb-4 flex items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-white/40">
                          Jumlah
                        </span>
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
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        disabled={out || adding || !selected}
                        onClick={handleAddToCart}
                        className={cn(
                          "inline-flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
                          out
                            ? "cursor-not-allowed bg-stone-100 text-stone-400 dark:bg-white/[0.06] dark:text-white/30"
                            : "bg-[#10B981] text-[#04140e] hover:bg-[#0ea572]"
                        )}
                        style={
                          out
                            ? undefined
                            : {
                                boxShadow:
                                  "inset 0 1px 0 rgba(255,255,255,0.2)",
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
                            <ShoppingCart
                              className="h-4 w-4"
                              strokeWidth={1.75}
                            />
                            Tambah ke Keranjang
                          </>
                        )}
                      </button>
                      {!out && (
                        <button
                          type="button"
                          onClick={handleOrderNow}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white py-3.5 text-sm font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98] dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:border-white/25 dark:hover:bg-white/[0.08]"
                        >
                          Pesan Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {related.length > 0 && (
            <Reveal delay={0.08}>
              <div className="mt-10">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white">
                      Menu lain di {stallName}
                    </h2>
                    <p className="mt-0.5 text-sm text-stone-500 dark:text-white/40">
                      Dari lapak yang sama
                    </p>
                  </div>
                  <Link
                    href="/#menu"
                    className="text-sm font-medium text-emerald-600 hover:underline dark:text-[#34d399]"
                  >
                    Lihat semua
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
                  {related.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition hover:border-stone-300 dark:border-white/[0.07] dark:bg-[#121214] dark:shadow-none dark:hover:border-white/[0.14]"
                    >
                      <div className="relative aspect-[4/3] bg-stone-100 dark:bg-stone-900">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(max-width:640px) 50vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 p-2.5 sm:p-3">
                        <p className="line-clamp-2 break-words text-[13px] font-semibold leading-snug text-stone-900 sm:text-sm dark:text-white">
                          {p.name}
                        </p>
                        {hasPriceRange(p) && (
                          <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-stone-400 sm:text-[10px] dark:text-white/35">
                            Mulai dari
                          </p>
                        )}
                        <p
                          className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-1 tabular-nums text-emerald-600 dark:text-[#34d399]"
                          aria-label={formatRupiah(getProductMinPrice(p))}
                        >
                          <span className="shrink-0 text-[10px] font-medium tracking-[0.02em] text-emerald-600/75 dark:text-[#34d399]/75">
                            Rp
                          </span>
                          <span className="break-all text-[13px] font-semibold leading-tight tracking-[-0.02em] sm:text-sm">
                            {Number(getProductMinPrice(p) || 0).toLocaleString(
                              "id-ID"
                            )}
                          </span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
