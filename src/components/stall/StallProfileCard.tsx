"use client";

import { useMemo, useState } from "react";
import { MessageSquarePlus, Star, Store, X } from "lucide-react";
import { Avatar } from "@/components/profile/Avatar";
import { useApp } from "@/context/AppContext";
import { useStallColor } from "@/context/StallColorContext";
import { cn } from "@/lib/utils";
import type { Seller, SellerReview } from "@/lib/types";

type Props = {
  seller: Seller;
};

function StarsRow({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            cls,
            n <= rounded
              ? "fill-amber-400 text-amber-400 dark:fill-amber-300 dark:text-amber-300"
              : "fill-stone-200 text-stone-200 dark:fill-white/10 dark:text-white/10"
          )}
          strokeWidth={0}
        />
      ))}
    </span>
  );
}

/**
 * Profil lapak — tampil saat customer filter satu lapak di menu.
 */
export function StallProfileCard({ seller }: Props) {
  const { state, addSellerReview, toast } = useApp();
  const { color: stallColor } = useStallColor();
  const [openReview, setOpenReview] = useState(false);
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(state.session?.name || "");
  const [busy, setBusy] = useState(false);

  const owner = useMemo(
    () =>
      state.users.find(
        (u) =>
          u.role === "seller" &&
          (u.sellerId === seller.id || u.id === seller.ownerUserId)
      ),
    [state.users, seller.id, seller.ownerUserId]
  );

  const ownerName = owner?.name || seller.name;
  const avatar = owner?.avatar;
  const rating = seller.rating ?? 0;
  const reviewCount = seller.reviewCount ?? 0;

  const reviews: SellerReview[] = useMemo(() => {
    const fromState = (state.reviews || []).filter(
      (r) => r.sellerId === seller.id
    );
    // Juga dari pesanan yang sudah dirating
    const fromOrders: SellerReview[] = state.orders
      .filter(
        (o) =>
          o.sellerId === seller.id &&
          o.rating &&
          o.rating >= 1 &&
          // skip jika sudah ada di reviews dengan orderId sama
          !fromState.some((r) => r.orderId === o.id)
      )
      .map((o) => ({
        id: `ordrev_${o.id}`,
        sellerId: o.sellerId,
        buyerName: o.buyerName,
        buyerId: o.buyerId,
        stars: o.rating!,
        comment: o.ratingComment || "",
        createdAt: o.ratedAt || o.updatedAt,
        orderId: o.id,
      }));

    return [...fromState, ...fromOrders]
      .filter((r) => r.comment || r.stars)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);
  }, [state.reviews, state.orders, seller.id]);

  function submitReview() {
    setBusy(true);
    const err = addSellerReview(
      seller.id,
      stars,
      comment,
      name.trim() || undefined
    );
    setBusy(false);
    if (err) {
      toast(err, "error");
      return;
    }
    setComment("");
    setStars(5);
    setOpenReview(false);
  }

  return (
    <div className="relative border-b border-stone-100 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      {/* Color gradient banner */}
      <div
        className="absolute inset-x-0 top-0 h-24 rounded-t-2xl opacity-90"
        style={{
          background: `linear-gradient(135deg, ${stallColor.primary}20, ${stallColor.primaryLight}, transparent)`,
        }}
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Avatar / logo */}
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <Avatar
            name={ownerName}
            avatar={avatar}
            size="xl"
            className="!h-20 !w-20 !text-xl sm:!h-24 sm:!w-24"
          />
          {seller.booth && (
            <span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm"
              style={{ backgroundColor: stallColor.primary, color: stallColor.badgeText }}
            >
              {seller.booth}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: stallColor.text }}
          >
            <Store className="h-3.5 w-3.5" strokeWidth={1.75} />
            Profil lapak
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-stone-900 dark:text-white sm:text-2xl">
              {seller.name}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Buka
            </span>
          </div>
          <p className="mt-0.5 text-sm text-stone-600 dark:text-white/55">
            Pedagang:{" "}
            <span className="font-semibold text-stone-800 dark:text-white/80">
              {ownerName}
            </span>
          </p>

          {/* Rating */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
              <Star
                className="h-3.5 w-3.5 fill-amber-500 text-amber-500 dark:fill-amber-300 dark:text-amber-300"
                strokeWidth={0}
              />
              {rating > 0 ? rating.toFixed(1) : "—"}
            </span>
            <StarsRow value={rating} />
            <span className="text-xs text-stone-500 dark:text-white/40">
              {reviewCount > 0
                ? `dari ${reviewCount.toLocaleString("id-ID")} ulasan`
                : "Belum ada ulasan"}
            </span>
          </div>

          {seller.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-white/55">
              {seller.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => setOpenReview((v) => !v)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition"
              style={{
                backgroundColor: stallColor.primary,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
            >
              <MessageSquarePlus className="h-4 w-4" strokeWidth={1.75} />
              {openReview ? "Tutup form ulasan" : "Beri ulasan / komentar"}
            </button>
          </div>
        </div>
      </div>

      {/* Form ulasan */}
      {openReview && (
        <div className="relative mt-5 rounded-2xl border bg-white p-4 shadow-sm dark:bg-black/30 sm:p-5" style={{ borderColor: stallColor.border }}>
          <button
            type="button"
            onClick={() => setOpenReview(false)}
            className="absolute right-3 top-3 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <p className="text-sm font-semibold text-stone-900 dark:text-white">
            Bagaimana pengalaman di {seller.name}?
          </p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-white/40">
            Rating & komentar Anda bantu teman sekelas pilih lapak.
          </p>

          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const on = n <= (hover || stars);
              return (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setStars(n)}
                  className="rounded-md p-0.5 transition hover:scale-110"
                  aria-label={`${n} bintang`}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition",
                      on
                        ? "fill-amber-400 text-amber-400"
                        : "fill-stone-200 text-stone-300 dark:fill-white/10 dark:text-white/20"
                    )}
                    strokeWidth={on ? 0 : 1.25}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-sm font-semibold text-stone-700 dark:text-white/80">
              {stars}/5
            </span>
          </div>

          {!state.session?.name && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda (opsional)"
              className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 dark:border-white/10 dark:bg-black/40 dark:text-white dark:placeholder:text-white/30"
            />
          )}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 280))}
            rows={3}
            placeholder="Tulis komentar… (contoh: enak, porsi pas, pelayanannya ramah)"
            className="mt-3 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 dark:border-white/10 dark:bg-black/40 dark:text-white dark:placeholder:text-white/30"
          />

          <button
            type="button"
            disabled={busy}
            onClick={submitReview}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
            style={{ backgroundColor: stallColor.primary }}
          >
            Kirim ulasan
          </button>
        </div>
      )}

      {/* Daftar ulasan terbaru */}
      {reviews.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-white/35">
            Ulasan terbaru
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-stone-200/80 bg-white/80 px-3.5 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-stone-800 dark:text-white/85">
                    {r.buyerName}
                  </p>
                  <StarsRow value={r.stars} size="sm" />
                </div>
                {r.comment ? (
                  <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-white/50">
                    “{r.comment}”
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
