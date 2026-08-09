"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Receipt,
  Store,
  ArrowRight,
  User,
} from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { useApp } from "@/context/AppContext";
import { formatDate, formatRupiah, orderStatusLabel } from "@/lib/utils";
import { PageTransition } from "@/components/motion/Reveal";

/**
 * Dashboard CUSTOMER — terpisah total dari dashboard penjual.
 * Fokus: belanja, riwayat, profil singkat.
 */
function CustomerDashboardInner() {
  const { state, cartCount } = useApp();
  const session = state.session!;

  const myOrders = state.orders
    .filter(
      (o) =>
        o.buyerId === session.id ||
        (o.buyerName === session.name && session.role === "buyer")
    )
    .slice(0, 8);

  const active = myOrders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  );

  const card =
    "rounded-2xl border border-stone-200/90 bg-white shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none";
  const cardSolid =
    "rounded-2xl border border-stone-200/90 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#121214] dark:shadow-none";

  return (
    <PageTransition>
      <div className="min-h-[100dvh] w-full bg-stone-100 px-4 py-8 dark:bg-[#0a0a0b] sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f97316] dark:text-[#f97316]/80">
            Area Customer
          </p>
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {session.avatar ? (
              <img
                src={session.avatar}
                alt=""
                className="h-12 w-12 rounded-full object-cover ring-1 ring-stone-200 dark:ring-white/10"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-600 ring-1 ring-stone-300 dark:bg-white/[0.08] dark:text-white/60 dark:ring-white/10">
                {session.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-stone-900 dark:text-white sm:text-3xl">
                Halo, {session.name.split(" ")[0]}
              </h1>
              <p className="mt-0.5 text-sm text-stone-500 dark:text-white/40">
                {session.kelas ? `Kelas ${session.kelas} · ` : ""}
                Pesan dari 5 lapak kantin
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/customer/profile"
            className="mt-3 inline-block text-xs font-semibold text-[#f97316] hover:underline dark:text-[#fb923c]"
          >
            Kelola akun & foto profil
          </Link>

          {/* Quick actions */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/"
              className={`group flex items-center gap-4 p-5 transition hover:border-[#f97316]/40 dark:hover:border-[#f97316]/30 dark:hover:bg-white/[0.05] ${card}`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f97316]/15 text-[#f97316] dark:bg-[#f97316]/15 dark:text-[#fb923c]">
                <Store className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-stone-900 dark:text-white">
                  Lihat Menu
                </p>
                <p className="text-xs text-stone-500 dark:text-white/40">
                  Pilih lapak & pesan
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-[#f97316] dark:text-white/30 dark:group-hover:text-[#fb923c]" />
            </Link>
            <Link
              href="/cart"
              className={`group flex items-center gap-4 p-5 transition hover:border-[#f97316]/40 dark:hover:border-[#f97316]/30 dark:hover:bg-white/[0.05] ${card}`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-white/[0.06] dark:text-white/70">
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-stone-900 dark:text-white">
                  Keranjang
                </p>
                <p className="text-xs text-stone-500 dark:text-white/40">
                  {cartCount > 0 ? `${cartCount} item` : "Kosong"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 dark:text-white/30" />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className={`${cardSolid} p-4`}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-white/35">
                Pesanan aktif
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">
                {active.length}
              </p>
            </div>
            <div className={`${cardSolid} p-4`}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 dark:text-white/35">
                Total riwayat
              </p>
              <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">
                {myOrders.length}
              </p>
            </div>
          </div>

          {/* Recent orders */}
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-white">
                <Receipt
                  className="h-4 w-4 text-[#f97316] dark:text-[#f97316]"
                  strokeWidth={1.5}
                />
                Pesanan terbaru
              </h2>
              <Link
                href="/orders"
                className="text-xs font-medium text-[#f97316] hover:underline dark:text-[#fb923c]"
              >
                Lihat semua
              </Link>
            </div>

            {!myOrders.length ? (
              <div className="rounded-2xl border border-dashed border-stone-300 py-12 text-center dark:border-white/10">
                <User className="mx-auto h-8 w-8 text-stone-300 dark:text-white/20" />
                <p className="mt-3 text-sm text-stone-500 dark:text-white/50">
                  Belum ada pesanan
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex rounded-full bg-[#f97316] px-5 py-2 text-xs font-semibold text-[#1c1917]"
                >
                  Mulai pesan
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {myOrders.map((o) => (
                  <li key={o.id} className={`${cardSolid} px-4 py-3`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-stone-900 dark:text-white">
                          {o.orderNumber}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-white/40">
                          {o.sellerName} · {formatDate(o.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#f97316] dark:text-[#fb923c]">
                          {formatRupiah(o.total)}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-white/45">
                          {orderStatusLabel(o.status)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function CustomerDashboardPage() {
  return (
    <RequireRole allow={["buyer"]}>
      <CustomerDashboardInner />
    </RequireRole>
  );
}
