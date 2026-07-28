"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useStallColor } from "@/context/StallColorContext";
import { formatRupiah } from "@/lib/utils";
import { PageTransition, Reveal } from "@/components/motion/Reveal";

export default function CartPage() {
  const {
    ready,
    state,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
  } = useApp();
  const [orderNotes, setOrderNotes] = useState("");
  const { color: stallColor } = useStallColor();

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-600" />
      </div>
    );
  }

  const cart = state.cart;

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
            Keranjang
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {cart.length
              ? `${cart.reduce((n, i) => n + i.qty, 0)} item dipilih`
              : "Belum ada item"}
          </p>
        </Reveal>

        {!cart.length ? (
          <Reveal delay={0.1}>
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
                <ShoppingBag className="h-7 w-7 text-stone-400" />
              </div>
              <p className="font-semibold text-stone-800 dark:text-stone-100">
                Keranjang masih kosong
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Pilih menu favorit di halaman utama
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
                style={{ backgroundColor: stallColor.primary }}
              >
                Lihat Menu <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="mt-8 space-y-3">
            {cart.map((item, i) => (
              <Reveal
                key={`${item.productId}::${item.variantId}`}
                delay={i * 0.04}
              >
                <div className="flex gap-3 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm transition duration-300 hover:shadow-md sm:gap-4 sm:p-4 dark:border-stone-800 dark:bg-[#121a16]">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-20 sm:w-20">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words font-semibold leading-snug text-stone-900 dark:text-white">
                          {item.productName || item.name}
                        </p>
                        {item.variantName &&
                          item.variantName !== item.productName && (
                            <p className="mt-0.5 break-words text-xs text-stone-500 dark:text-stone-400">
                              {item.variantName}
                            </p>
                          )}
                        <p className="mt-0.5 whitespace-nowrap text-sm font-medium" style={{ color: stallColor.text }}>
                          {formatRupiah(item.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.productId, item.variantId)
                        }
                        className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(item.productId, item.variantId, -1)
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 transition dark:border-stone-700"
                        style={{ borderColor: undefined }}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 shrink-0 text-center text-sm font-bold">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(item.productId, item.variantId, 1)
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 transition dark:border-stone-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <span className="ml-auto whitespace-nowrap text-sm font-bold text-stone-800 dark:text-stone-100">
                        {formatRupiah(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}

            <Reveal delay={0.15}>
              <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-6 dark:border-stone-800 dark:bg-[#121a16]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-500">
                    Subtotal
                  </span>
                  <span className="text-xl font-bold text-stone-900 dark:text-white">
                    {formatRupiah(cartSubtotal)}
                  </span>
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Catatan Pesanan (opsional)
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition focus:ring-2 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500"
                    placeholder="Contoh: Es batu sedikit, tidak pedas, extra sambal..."
                  />
                </div>

                <p className="mt-3 text-xs text-stone-400">
                  Biaya platform akan dihitung di halaman checkout.
                </p>
                <Link
                  href="/checkout"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-soft transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ backgroundColor: stallColor.primary }}
                >
                  Lanjut ke Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
