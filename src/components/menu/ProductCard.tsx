"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Ban } from "lucide-react";
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

export function ProductCard({
  product,
  index = 0,
  sellerName,
}: {
  product: Product;
  index?: number;
  sellerName?: string;
}) {
  const { color: stallColor } = useStallColor();
  const out = isProductOutOfStock(product);
  const minPrice = getProductMinPrice(product);
  const showFrom = hasPriceRange(product);
  const variantCount = getActiveVariants(product).length;
  const totalStock = getProductTotalStock(product);
  const priceText = Number(minPrice || 0).toLocaleString("id-ID");

  return (
    <motion.article
      initial={{ opacity: 1, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.03, 0.25),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4 }}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-colors duration-200 hover:border-stone-300 dark:border-white/[0.07] dark:bg-[#121214] dark:shadow-none dark:hover:border-white/[0.12]"
    >
      {/* Klik → detail + pilih varian */}
      <Link
        href={`/product/${product.id}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
        aria-label={`Lihat detail ${product.name}, ${formatRupiah(minPrice)}`}
      />

      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-800">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, (max-width:1280px) 25vw, 20vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          unoptimized
        />
        <span className="absolute left-2 top-2 max-w-[46%] truncate rounded-full border border-black/10 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md sm:left-3 sm:top-3 sm:max-w-none sm:px-2.5 sm:py-1 sm:text-[11px] dark:border-white/10">
          {product.category}
        </span>
        {sellerName && (
          <span
            className="absolute left-2 bottom-2 max-w-[60%] truncate rounded-full px-2 py-0.5 text-[9px] font-semibold shadow-sm sm:left-3 sm:bottom-3 sm:max-w-none sm:px-2.5 sm:py-1 sm:text-[10px]"
            style={{
              backgroundColor: stallColor.primaryLight,
              color: stallColor.text,
            }}
          >
            {sellerName}
          </span>
        )}
        {out ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/90">
              Habis
            </span>
          </span>
        ) : (
          <span
            className="absolute right-2 top-2 max-w-[48%] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold text-white sm:right-3 sm:top-3 sm:max-w-none sm:px-2.5 sm:py-1 sm:text-[11px]"
            style={{ backgroundColor: stallColor.primary }}
          >
            {variantCount > 1
              ? `${variantCount} varian`
              : `Stok ${totalStock}`}
          </span>
        )}
      </div>

      {/* Body: flex-col agar harga + CTA selalu muat di layar sempit */}
      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-3.5 md:p-4">
        <h3 className="line-clamp-2 break-words text-[13px] font-semibold leading-snug tracking-[-0.01em] text-stone-900 sm:text-[15px] dark:text-white">
          {product.name}
        </h3>
        {product.description ? (
          <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-stone-500 sm:line-clamp-2 sm:text-xs dark:text-white/40">
            {product.description}
          </p>
        ) : null}

        {/* Harga SELALU full di baris sendiri — tidak dipotong tombol */}
        <div className="mt-auto min-w-0 pt-2.5 sm:pt-3">
          {showFrom && (
            <p className="text-[9px] font-medium uppercase tracking-wide text-stone-400 sm:text-[10px] dark:text-white/35">
              Mulai dari
            </p>
          )}
          <p
            className="flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-0.5 tabular-nums"
            style={{ color: stallColor.text }}
            aria-label={
              showFrom
                ? `Mulai dari ${formatRupiah(minPrice)}`
                : formatRupiah(minPrice)
            }
          >
            <span
              className="shrink-0 text-[10px] font-medium leading-none tracking-[0.02em] sm:text-[11px]"
              style={{ color: stallColor.textLight }}
            >
              Rp
            </span>
            <span className="break-all text-[14px] font-semibold leading-tight tracking-[-0.02em] sm:text-[15px] md:text-base">
              {priceText}
            </span>
          </p>

          {/* CTA full-width di mobile biar tidak menindih harga */}
          <span
            className={
              out
                ? "relative z-20 mt-2 inline-flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-full bg-stone-100 px-2.5 py-1.5 text-[11px] font-semibold text-stone-400 sm:mt-3 sm:px-3 sm:py-2 sm:text-xs dark:bg-white/[0.06] dark:text-white/30"
                : "relative z-20 mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors duration-200 sm:mt-3 sm:px-3 sm:py-2 sm:text-xs"
            }
            style={
              out
                ? undefined
                : {
                    backgroundColor: stallColor.primary,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                  }
            }
          >
            {out ? (
              <>
                <Ban className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={1.5} />{" "}
                Habis
              </>
            ) : (
              <>
                Pilih{" "}
                <ChevronRight
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                  strokeWidth={1.75}
                />
              </>
            )}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
