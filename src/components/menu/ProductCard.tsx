"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Ban, ChevronRight } from "lucide-react";
import { useStallColor } from "@/context/StallColorContext";
import type { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import {
  getActiveVariants,
  getProductMinPrice,
  getProductTotalStock,
  hasPriceRange,
  isProductOutOfStock,
} from "@/lib/product";
import { ProductQuickView } from "@/components/menu/ProductQuickView";

export function ProductCard({
  product,
  sellerName,
  sellerIsOpen = true,
}: {
  product: Product;
  index?: number;
  sellerName?: string;
  sellerIsOpen?: boolean;
}) {
  const { color: stallColor } = useStallColor();
  const [quickOpen, setQuickOpen] = useState(false);
  const out = isProductOutOfStock(product);
  const minPrice = getProductMinPrice(product);
  const showFrom = hasPriceRange(product);
  const variantCount = getActiveVariants(product).length;
  const totalStock = getProductTotalStock(product);
  const priceText = Number(minPrice || 0).toLocaleString("id-ID");
  const detailHref = `/product/${product.id}`;

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-stone-200/90 bg-white transition-shadow duration-200 hover:shadow-md dark:border-white/[0.07] dark:bg-[#121214] dark:hover:border-white/[0.12]">
      {/* Gambar → halaman detail */}
      <Link
        href={detailHref}
        className="relative block aspect-square overflow-hidden bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB300] dark:bg-stone-800"
        aria-label={`Lihat detail ${product.name}, ${formatRupiah(minPrice)}`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, (max-width:1280px) 25vw, 20vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          unoptimized
        />
        <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white/90 sm:left-2 sm:top-2 sm:text-[10px]">
          {product.category}
        </span>
        {sellerName && (
          <span className="absolute right-1.5 top-1.5 max-w-[55%] truncate rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-stone-700 sm:right-2 sm:top-2 sm:text-[10px]">
            {sellerName}
          </span>
        )}
        {out && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
              Habis
            </span>
          </span>
        )}
        {!sellerIsOpen && !out && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-lg bg-red-500/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg">
              Tutup
            </span>
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="line-clamp-2 break-words text-[12px] font-medium leading-snug text-stone-800 sm:text-[13px] dark:text-white">
          <Link
            href={detailHref}
            className="transition-colors hover:text-[#FFB300] dark:hover:text-[#FFC107]"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto min-w-0 pt-1.5">
          <p
            className="flex min-w-0 flex-wrap items-baseline gap-x-1 tabular-nums"
            style={{ color: stallColor.text }}
            aria-label={
              showFrom
                ? `Mulai dari ${formatRupiah(minPrice)}`
                : formatRupiah(minPrice)
            }
          >
            {showFrom && (
              <span className="shrink-0 text-[10px] font-medium leading-none text-stone-400 dark:text-white/35">
                mulai
              </span>
            )}
            <span
              className="shrink-0 text-[11px] font-medium leading-none"
              style={{ color: stallColor.textLight }}
            >
              Rp
            </span>
            <span className="break-all text-[14px] font-semibold leading-tight tracking-[-0.02em] sm:text-[15px]">
              {priceText}
            </span>
          </p>

          <p className="mt-1 text-[10px] text-stone-400 dark:text-white/35">
            {out
              ? "Stok habis"
              : variantCount > 1
                ? `${variantCount} varian`
                : `Stok ${totalStock}`}
          </p>

          {out ? (
            <span className="mt-2 flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-md bg-stone-100 px-2 py-1.5 text-[11px] font-semibold text-stone-400 dark:bg-white/[0.06] dark:text-white/30">
              <Ban className="h-3 w-3" strokeWidth={1.5} /> Habis
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold text-white transition-colors duration-200 hover:brightness-110"
              style={{
                backgroundColor: stallColor.primary,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
              }}
              aria-label={`Pilih ${product.name}`}
            >
              Pilih
              <ChevronRight className="h-3 w-3" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      <ProductQuickView
        product={product}
        sellerName={sellerName}
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
      />
    </article>
  );
}
