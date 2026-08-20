"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgePercent,
  Candy,
  GlassWater,
  LayoutGrid,
  Megaphone,
  Tag,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useStallColor } from "@/context/StallColorContext";
import { ProductCard } from "@/components/menu/ProductCard";
import { StallProfileCard } from "@/components/stall/StallProfileCard";
import { cn } from "@/lib/utils";

const CAT_META: Record<string, { icon: LucideIcon }> = {
  Semua: { icon: LayoutGrid },
  Makanan: { icon: Utensils },
  Minuman: { icon: GlassWater },
  Snack: { icon: Candy },
  Promo: { icon: BadgePercent },
};

const CAT_FALLBACK: LucideIcon = Utensils;

type SortMode = "default" | "harga" | "populer";

const SHELL =
  "mx-auto w-full max-w-[1280px] px-3 sm:px-5";

/** Baca `?q=` dari URL (dari search header) — dibungkus Suspense agar aman di SSR */
function UrlQuerySync({ setQ }: { setQ: (q: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    setQ(searchParams.get("q") || "");
  }, [searchParams, setQ]);
  return null;
}

function HomeContent() {
  const { state } = useApp();
  const { color: stallColor, selectSeller } = useStallColor();
  const router = useRouter();
  const [cat, setCat] = useState<string>("Semua");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("default");

  const cats = useMemo(() => {
    const base: string[] = ["Semua"];
    for (const c of state.settings.menuCategories || []) {
      if (c && !base.includes(c)) base.push(c);
    }
    if (!base.includes("Promo")) base.push("Promo");
    return base;
  }, [state.settings.menuCategories]);

  const announcements = useMemo(() => {
    const list = state.settings.announcements || [];
    return list.filter((a) => a.audience === "all" || a.audience === "buyers");
  }, [state.settings.announcements]);

  useEffect(() => {
    if (state.session?.role === "seller") {
      router.replace("/dashboard/seller");
    }
  }, [state.session, router]);

  const isSellerSession = state.session?.role === "seller";

  const activeSellers = useMemo(
    () => state.sellers.filter((s) => s.isActive),
    [state.sellers]
  );

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
      list = list.filter((p) =>
        p.variants?.some((v) => v.price < 10000)
      );
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
        const stockA =
          a.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        const stockB =
          b.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
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
    "border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 dark:hover:text-white";
  const chipActiveSeller = cn("text-white");
  const chipActiveSort = cn("text-white");

  return (
    <>
      <Suspense fallback={null}>
        <UrlQuerySync setQ={setQ} />
      </Suspense>
      {isSellerSession ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-[#059669]" />
        </div>
      ) : (
        <>
          {/* Pengumuman — banner tipis */}
          {announcements.length > 0 && (
            <section className="border-b border-amber-200/60 bg-amber-50 dark:border-amber-400/10 dark:bg-[#1a1505]">
              <div className={SHELL}>
                <div className="flex flex-col gap-2 py-3 sm:py-3.5">
                  {announcements.map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-[#047857]" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                          {a.title}
                        </p>
                        <p className="text-xs leading-relaxed text-stone-600 dark:text-white/60">
                          {a.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Kategori — bar ikon ala marketplace */}
          <section className="border-b border-stone-200 bg-white dark:border-white/[0.08] dark:bg-[#141416]">
            <div className={SHELL}>
              <div className="overflow-x-auto py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:py-4">
                <div className="mx-auto flex w-fit items-center gap-5 px-1 sm:gap-7">
                  {cats.map((c) => {
                    const meta = CAT_META[c] || { icon: CAT_FALLBACK };
                    const Icon = meta.icon;
                    const active = cat === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCat(c)}
                        className="flex shrink-0 cursor-pointer flex-col items-center gap-1.5"
                      >
                        <span
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl border transition sm:h-14 sm:w-14",
                            active
                              ? "border-transparent bg-[#059669] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                              : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white"
                          )}
                        >
                          <Icon className="h-6 w-6" strokeWidth={1.75} />
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            active
                              ? "font-semibold text-[#059669]"
                              : "text-stone-600 dark:text-white/60"
                          )}
                        >
                          {c}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Banner — tipis, bukan hero */}
          <section className="bg-stone-100 dark:bg-[#0a0a0b]">
            <div className={SHELL}>
              <div className="relative mt-4 h-40 overflow-hidden rounded-lg sm:h-48">
                <div
                  className="absolute inset-0 scale-[1.02] bg-cover bg-[center_40%] bg-no-repeat"
                  style={{ backgroundImage: "url('/images/kantin-smkn17.jpg')" }}
                  role="img"
                  aria-label="Kantin SMK Negeri 17 Jakarta"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#059669]/90 via-[#059669]/60 to-[#059669]/10" />
                <div className="relative flex h-full items-center px-5 sm:px-8">
                  <div className="max-w-md">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
                      Pesan online · Ambil di kantin
                    </p>
                    <h1 className="mt-1 text-xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-2xl">
                      Kantin SMK Negeri 17, sekarang bisa dipesan online.
                    </h1>
                    <a
                      href="#menu"
                      className="mt-3 inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-md bg-white px-4 py-2 text-[13px] font-semibold text-[#059669] transition-colors hover:bg-amber-50"
                    >
                      Lihat Menu
                      <ArrowRight
                        className="h-4 w-4"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Daftar menu */}
          <section id="menu" className="bg-stone-100 dark:bg-[#0a0a0b]">
            <div className={SHELL}>
              <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
                <div>
                  <h2 className="text-lg font-bold tracking-[-0.02em] text-stone-900 dark:text-white">
                    Menu Hari Ini
                  </h2>
                  <p className="mt-0.5 text-[13px] text-stone-500 dark:text-white/40">
                    {products.length} menu
                    {sellerFilter !== "all"
                      ? ` · ${sellerName(sellerFilter)}`
                      : " · semua lapak"}
                    {cat !== "Semua" ? ` · ${cat}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
                    Urutkan
                  </span>
                  {(
                    [
                      ["default", "Terbaru", null],
                      ["populer", "Populer", TrendingUp],
                      ["harga", "Harga", Tag],
                    ] as Array<
                      [SortMode, string, LucideIcon | null]
                    >
                  ).map(([mode, label, Icon]) => {
                    const active = sortBy === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSortBy(mode)}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? cn(chipActiveSort, "border-transparent")
                            : chipIdle
                        )}
                        style={
                          active
                            ? {
                                backgroundColor: stallColor.primary,
                                boxShadow:
                                  "inset 0 1px 0 rgba(255,255,255,0.18)",
                              }
                            : undefined
                        }
                      >
                        {Icon ? (
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        ) : null}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter lapak */}
              <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
                  Lapak
                </span>
                <button
                  type="button"
                  onClick={() => setSellerFilter("all")}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    sellerFilter === "all"
                      ? cn(chipActiveSeller, "border-transparent")
                      : chipIdle
                  )}
                  style={
                    sellerFilter === "all"
                      ? {
                          backgroundColor: stallColor.primary,
                          color: stallColor.badgeText,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                        }
                      : undefined
                  }
                >
                  Semua lapak
                </button>
                {activeSellers.map((s) => {
                  const isActive = sellerFilter === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSellerFilter(s.id)}
                      className={cn(
                        "shrink-0 cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                        isActive
                          ? cn(chipActiveSeller, "border-transparent")
                          : chipIdle
                      )}
                      style={
                        isActive
                          ? {
                              backgroundColor: stallColor.primary,
                              color: stallColor.badgeText,
                              boxShadow:
                                "inset 0 1px 0 rgba(255,255,255,0.18)",
                            }
                          : undefined
                      }
                    >
                      {s.booth ? `${s.booth} · ` : ""}
                      {s.name}
                    </button>
                  );
                })}
              </div>

              {selectedStall && (
                <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-white/[0.08] dark:bg-[#141416]">
                  <StallProfileCard seller={selectedStall} />
                </div>
              )}

              <div className="py-5">
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
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
                    {products.map((p) => {
                      const productSeller = state.sellers.find(
                        (s) => s.id === p.sellerId
                      );
                      return (
                        <ProductCard
                          key={p.id}
                          product={p}
                          sellerName={
                            sellerFilter === "all"
                              ? sellerName(p.sellerId)
                              : undefined
                          }
                          sellerIsOpen={productSeller?.isOpen !== false}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
