"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, TrendingUp, Tag } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useStallColor } from "@/context/StallColorContext";
import { ProductCard } from "@/components/menu/ProductCard";
import { StallProfileCard } from "@/components/stall/StallProfileCard";
import { BrandBadge } from "@/components/brand/BrandMark";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Reveal, PageTransition } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";

const CATS: Array<"Semua" | ProductCategory | "Promo"> = [
  "Semua",
  "Makanan",
  "Minuman",
  "Snack",
  "Promo",
];

type SortMode = "default" | "harga" | "populer";

/** Lebar konten penuh â€” isi layar desktop tanpa â€œkolom kosongâ€ di kanan-kiri */
const SHELL =
  "mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10";

export default function HomePage() {
  const { state } = useApp();
  const { color: stallColor, selectSeller } = useStallColor();
  const router = useRouter();
  const [cat, setCat] = useState<"Semua" | ProductCategory | "Promo">("Semua");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("default");

  // Pedagang tidak belanja — ke dashboard lapak
  useEffect(() => {
    if (state.session?.role === "seller") {
      router.replace("/dashboard/seller");
    }
  }, [state.session, router]);

  // Sembunyikan konten menu jika seller (anti-flash)
  const isSellerSession = state.session?.role === "seller";

  const activeSellers = useMemo(
    () => state.sellers.filter((s) => s.isActive),
    [state.sellers]
  );

  // Update stall color when seller filter changes
  useEffect(() => {
    if (sellerFilter === "all") {
      selectSeller(null);
    } else {
      selectSeller(sellerFilter);
    }
  }, [sellerFilter, selectSeller]);

  const products = useMemo(() => {
    let list = state.products.filter((p) => p.isActive);
    if (sellerFilter !== "all") {
      list = list.filter((p) => p.sellerId === sellerFilter);
    }
    if (cat === "Promo") {
      list = list.filter((p) => {
        const hasDiscount = p.variants?.some((v) => v.price < 10000);
        return hasDiscount;
      });
    } else if (cat !== "Semua") {
      list = list.filter((p) => p.category === cat);
    }
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          (p.variants || []).some((v) => v.name.toLowerCase().includes(s))
      );
    }
    if (sortBy === "harga") {
      list = [...list].sort((a, b) => {
        const priceA = a.variants?.[0]?.price || 0;
        const priceB = b.variants?.[0]?.price || 0;
        return priceA - priceB;
      });
    } else if (sortBy === "populer") {
      list = [...list].sort((a, b) => {
        const stockA = a.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        const stockB = b.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        return stockB - stockA;
      });
    }
    return list;
  }, [state.products, cat, q, sellerFilter, sortBy]);

  const sellerName = (id: string) =>
    state.sellers.find((s) => s.id === id)?.name || "Lapak";

  const selectedStall = useMemo(
    () =>
      sellerFilter !== "all"
        ? state.sellers.find((s) => s.id === sellerFilter && s.isActive)
        : undefined,
    [state.sellers, sellerFilter]
  );

  const chipIdle =
    "border border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900 dark:border-white/10 dark:text-white/55 dark:hover:border-white/20 dark:hover:text-white/80";
  const chipActiveSeller = cn(
    "ring-1 text-white"
  );
  const chipActiveCat = cn(
    "ring-1 text-white"
  );

  return (
    <PageTransition>
      {/* Seller di-redirect ke dashboard â€” jangan render konten menu */}
      {isSellerSession ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-kantin-200 border-t-kantin-600" />
        </div>
      ) : (
      <>
      {/* Hero â€” full-bleed di bawah header (tanpa strip hitam di atas) */}
      <section className="relative overflow-hidden border-b border-white/[0.06] bg-[#0a0a0b]">
        {/* Background photo â€” di public/images agar dilayani Next.js */}
        <div
          className="absolute inset-0 scale-[1.02] bg-cover bg-[center_40%] bg-no-repeat"
          style={{ backgroundImage: "url('/images/kantin-smkn17.jpg')" }}
          role="img"
          aria-label="Kantin SMK Negeri 17 Jakarta"
        />

        {/* Layered dark overlays â€” foto tetap terasa, teks tetap kontras */}
        <div
          className="absolute inset-0 bg-[#0a0a0b]/55"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b]/92 via-[#0a0a0b]/72 to-[#0a0a0b]/35"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/25 to-[#0a0a0b]/45"
          aria-hidden
        />
        {/* Warm orange brand tint â€” menyatu dengan dark + oranye KantinKu */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(249,115,22,0.18),_transparent_52%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(249,115,22,0.08),_transparent_45%)]"
          aria-hidden
        />

        {/* pt ekstra = ruang header fixed (pt-3/4 + bar 56/60) + breathing room */}
        <div
          className={cn(
            "relative pb-14 pt-[5.75rem] sm:pb-16 sm:pt-[6.5rem] lg:pb-24 lg:pt-[7rem]",
            SHELL
          )}
        >
          <Reveal>
            <BrandBadge className="border-white/10 bg-black/35 text-white/80 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md">
              {state.settings.schoolName}
            </BrandBadge>
          </Reveal>

          <div className="mt-6 max-w-3xl lg:mt-7">
            <SplitHeading
              text={"Kantin SMK Negeri 17\nsekarang bisa dipesan online."}
              className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-4xl sm:leading-[1.08] md:text-5xl"
            />
            <Reveal delay={0.12}>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 sm:mt-5">
                Gak usah antri lama. Pilih makanan, bayar digital, terus ambil di
                kantin. Simpel, cepet, langsung ke lapak.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-7 flex flex-wrap gap-3 sm:mt-8">
                <a
                  href="#menu"
                  className="group inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
                  style={{
                    backgroundColor: stallColor.primary,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 10px 30px -10px ${stallColor.primary}`,
                  }}
                >
                  Lihat Menu
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </a>
                <Link
                  href="/orders"
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-6 py-3 text-sm font-semibold text-white/90 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.14] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                >
                  Cek Pesanan
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Menu â€” full-width shell, filters + grid in one panel */}
      <section
        id="menu"
        className="bg-stone-100 pb-16 pt-8 dark:bg-[#0a0a0b] sm:pb-20 sm:pt-10"
      >
        <div className={SHELL}>
          <Reveal>
            <div className="overflow-hidden rounded-[1.75rem] border border-stone-200/90 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0e0e10] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] dark:shadow-none">
              {/* Toolbar: title + search + filters â€” satu area menyatu */}
              <div className="border-b border-stone-100 bg-stone-50/80 px-4 py-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-6 sm:py-6 lg:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] text-stone-900 dark:text-white">
                      Menu Hari Ini
                    </h2>
                    <p className="mt-1 text-sm text-stone-500 dark:text-white/40">
                      {products.length} menu
                      {sellerFilter !== "all"
                        ? ` Â· ${sellerName(sellerFilter)}`
                        : " Â· semua lapak"}
                      {cat !== "Semua" ? ` Â· ${cat}` : ""}
                    </p>
                  </div>
                  <div className="relative w-full lg:max-w-sm lg:shrink-0">
                    <Search
                      className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-white/35"
                      strokeWidth={1.5}
                    />
                    <input
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Cari menu..."
                      className="w-full rounded-full border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-stone-900 placeholder:text-stone-400 transition focus:ring-2 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30"
                    />
                  </div>
                </div>

                {/* Filter lapak */}
                <div className="mt-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
                    Lapak
                  </p>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                    <button
                      type="button"
                      onClick={() => setSellerFilter("all")}
                      className={cn(
                        "shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200",
                        sellerFilter === "all"
                          ? "bg-stone-900 text-white dark:bg-white dark:text-[#0a0a0b]"
                          : chipIdle
                      )}
                    >
                      Semua lapak
                    </button>
                    {activeSellers.map((s) => {
                      const isActive = sellerFilter === s.id;
                      const sellerColor = isActive ? stallColor : null;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSellerFilter(s.id)}
                          className={cn(
                            "shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200",
                            isActive ? chipActiveSeller : chipIdle
                          )}
                          style={isActive ? {
                            backgroundColor: sellerColor?.primary,
                            color: sellerColor?.badgeText,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.1)`,
                          } : undefined}
                        >
                          {s.booth ? `${s.booth} · ` : ""}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter kategori */}
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
                    Kategori
                  </p>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
                    {CATS.map((c) => {
                      const isActive = cat === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCat(c)}
                          className={cn(
                            "shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                            isActive ? chipActiveCat : cn("bg-white dark:bg-white/[0.03]", chipIdle)
                          )}
                          style={isActive ? {
                            backgroundColor: stallColor.primaryLight,
                            color: stallColor.text,
                            boxShadow: `inset 0 0 0 1px ${stallColor.border}`,
                          } : undefined}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort & Filter tambahan */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
                    Urutkan
                  </p>
                  <button
                    type="button"
                    onClick={() => setSortBy("default")}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
                      sortBy === "default"
                        ? "bg-stone-900 text-white dark:bg-white dark:text-[#0a0a0b]"
                        : chipIdle
                    )}
                  >
                    Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("harga")}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
                      sortBy === "harga" ? chipActiveSeller : chipIdle
                    )}
                    style={sortBy === "harga" ? {
                      backgroundColor: stallColor.primaryLight,
                      color: stallColor.text,
                      boxShadow: `inset 0 0 0 1px ${stallColor.border}`,
                    } : undefined}
                  >
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Harga
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("populer")}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200",
                      sortBy === "populer" ? chipActiveSeller : chipIdle
                    )}
                    style={sortBy === "populer" ? {
                      backgroundColor: stallColor.primaryLight,
                      color: stallColor.text,
                      boxShadow: `inset 0 0 0 1px ${stallColor.border}`,
                    } : undefined}
                  >
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Populer
                    </span>
                  </button>
                </div>
              </div>

              {/* Profil lapak â€” hanya saat filter 1 lapak */}
              {selectedStall && <StallProfileCard seller={selectedStall} />}

              {/* Product grid */}
              <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
                {selectedStall && (
                  <p className="mb-4 text-sm font-semibold text-stone-700 dark:text-white/70">
                    Menu di {selectedStall.name}
                    <span className="ml-1.5 font-normal text-stone-400 dark:text-white/40">
                      ({products.length})
                    </span>
                  </p>
                )}
                {products.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center sm:py-20">
                    <p className="font-semibold text-stone-700 dark:text-white/80">
                      Tidak ada menu ditemukan
                    </p>
                    <p className="mt-1 text-sm text-stone-500 dark:text-white/40">
                      Coba ubah filter atau kata kunci
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
                    {products.map((p, i) => (
                      <div key={p.id} className="flex min-w-0 flex-col">
                        <div className="min-w-0 flex-1">
                          <ProductCard
                            product={p}
                            index={i}
                            sellerName={sellerFilter === "all" ? sellerName(p.sellerId) : undefined}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      </>
      )}
    </PageTransition>
  );
}
