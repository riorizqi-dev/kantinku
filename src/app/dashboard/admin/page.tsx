"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
  Percent,
  Landmark,
  CheckCircle,
  XCircle,
  Send,
  Megaphone,
  Plus,
  Trash2,
  Power,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  cn,
  formatDate,
  formatRupiah,
  orderStatusLabel,
  paymentStatusLabel,
  withdrawalStatusLabel,
  withdrawalMethodLabel,
} from "@/lib/utils";
import { PageTransition } from "@/components/motion/Reveal";
import { DashboardShell } from "@/components/layout/DashboardShell";

type Tab = "overview" | "orders" | "sellers" | "reports" | "pencairan" | "pengumuman";

/**
 * Dashboard Admin Platform
 * - Lihat semua pesanan
 * - Lihat daftar penjual
 * - Laporan penjualan
 * - TIDAK BISA kelola produk/stok
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const { ready, state, processWithdrawal, completeWithdrawal, addAnnouncement, removeAnnouncement, updateSeller, toast } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const session = state.session;
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annAudience, setAnnAudience] = useState<"all" | "sellers" | "buyers">("all");

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role === "superadmin") {
      router.replace("/dashboard/super");
      return;
    }
    if (session.role !== "admin") {
      router.replace("/");
    }
  }, [ready, session, router]);

  const paidOrders = useMemo(
    () => state.orders.filter((o) => o.paymentStatus === "paid"),
    [state.orders]
  );

  const stats = useMemo(() => {
    const gmv = paidOrders.reduce((n, o) => n + o.subtotal, 0);
    const commission = paidOrders.reduce((n, o) => n + o.commissionAmount, 0);
    const sellerNet = paidOrders.reduce((n, o) => n + o.sellerAmount, 0);
    return {
      orders: paidOrders.length,
      gmv,
      commission,
      sellerNet,
      sellers: state.sellers.length,
      pending: state.orders.filter(
        (o) =>
          o.paymentStatus === "paid" &&
          (o.status === "waiting" || o.status === "processing")
      ).length,
    };
  }, [paidOrders, state.sellers, state.orders]);

  /** Laporan per penjual */
  const sellerReport = useMemo(() => {
    return state.sellers.map((s) => {
      const orders = paidOrders.filter(
        (o) => o.sellerId === s.id && o.status !== "cancelled"
      );
      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        orderCount: orders.length,
        gmv: orders.reduce((n, o) => n + o.subtotal, 0),
        commission: orders.reduce((n, o) => n + o.commissionAmount, 0),
        net: orders.reduce((n, o) => n + o.sellerAmount, 0),
      };
    });
  }, [state.sellers, paidOrders]);

  if (!ready || !session || session.role !== "admin") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-[#059669]" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Semua Pesanan" },
    { id: "sellers", label: "Penjual" },
    { id: "reports", label: "Laporan" },
    { id: "pencairan", label: "Pencairan" },
    { id: "pengumuman", label: "Pengumuman" },
  ];

  return (
    <PageTransition>
      <DashboardShell>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
          Admin Platform
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
          Monitoring & Laporan
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Lihat pesanan, penjual, dan laporan. Pengelolaan produk hanya oleh
          Penjual.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Pesanan lunas",
              value: String(stats.orders),
              icon: ShoppingBag,
            },
            {
              label: "Total penjualan",
              value: formatRupiah(stats.gmv),
              icon: TrendingUp,
            },
            {
              label: "Komisi platform",
              value: formatRupiah(stats.commission),
              icon: Percent,
            },
            {
              label: "Penjual",
              value: String(stats.sellers),
              icon: Store,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-[#121a16]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {s.label}
                </p>
                <s.icon className="h-4 w-4 text-[#059669]" />
              </div>
              <p className="mt-2 text-xl font-bold text-stone-900 dark:text-white">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-stone-200 pb-3 dark:border-stone-800">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                tab === t.id
                  ? "bg-[#059669] text-[#1c1917] shadow-soft"
                  : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-[#121214] md:col-span-1">
              <h2 className="font-bold text-stone-900 dark:text-white">
                Ringkasan
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-stone-600 dark:text-stone-300">
                <li className="flex justify-between gap-3">
                  <span>Pesanan aktif (menunggu/diproses)</span>
                  <span className="font-bold">{stats.pending}</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>Pendapatan bersih penjual</span>
                  <span className="font-bold">
                    {formatRupiah(stats.sellerNet)}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>Rate komisi platform</span>
                  <span className="font-bold">
                    {state.settings.commissionRate}%
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>Total GMV</span>
                  <span className="font-bold">{formatRupiah(stats.gmv)}</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-stone-400">
                Rate komisi hanya dapat diubah oleh Super Admin.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-[#121214]">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#059669]" />
                <h2 className="font-bold text-stone-900 dark:text-white">
                  Akses Anda
                </h2>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-stone-600 dark:text-stone-300">
                <li>Lihat semua pesanan</li>
                <li>Lihat daftar penjual</li>
                <li>Lihat laporan penjualan</li>
              </ul>
              <p className="mt-4 text-xs font-semibold text-amber-700 dark:text-amber-400">
                Tidak termasuk: tambah/edit/hapus produk & stok (khusus Penjual)
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-[#121214] md:col-span-2 xl:col-span-1">
              <h2 className="font-bold text-stone-900 dark:text-white">
                Komisi platform
              </h2>
              <p className="mt-2 text-3xl font-semibold text-[#047857] dark:text-[#10b981]">
                {formatRupiah(stats.commission)}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Dari {stats.orders} transaksi lunas · rate{" "}
                {state.settings.commissionRate}%
              </p>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-6 space-y-3">
            {!state.orders.length ? (
              <p className="py-12 text-center text-sm text-stone-500">
                Belum ada pesanan
              </p>
            ) : (
              state.orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#121a16]"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-bold">{o.orderNumber}</p>
                      <p className="text-xs text-stone-500">
                        {formatDate(o.createdAt)} · {o.sellerName}
                      </p>
                      <p className="mt-1 text-sm">
                        {o.buyerName} ({o.buyerClass})
                      </p>
                      <ul className="mt-2 text-xs text-stone-500">
                        {o.items.map((it) => (
                          <li key={it.productId + it.name}>
                            {it.name} x{it.qty}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-bold text-[#047857] dark:text-[#10b981]">
                        {formatRupiah(o.total)}
                      </p>
                      <p className="text-xs text-stone-400">
                        Komisi: {formatRupiah(o.commissionAmount)} · Penjual:{" "}
                        {formatRupiah(o.sellerAmount)}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {paymentStatusLabel(o.paymentStatus)} ·{" "}
                        {orderStatusLabel(o.status)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "sellers" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {state.sellers.map((s) => {
              const rep = sellerReport.find((r) => r.id === s.id);
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#121214]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 dark:text-white">
                        {s.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {s.booth ? `Booth ${s.booth} · ` : ""}
                        WA: {s.phone || "—"} ·{" "}
                        {s.isActive ? "Aktif" : "Nonaktif"}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">
                        {rep?.orderCount ?? 0} pesanan
                      </p>
                      <p className="text-xs text-stone-500">
                        Omzet {formatRupiah(rep?.gmv ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 dark:border-stone-800 dark:bg-black/30">
                    <div className="flex items-center gap-2">
                      <Power
                        className={cn(
                          "h-3.5 w-3.5",
                          s.isOpen !== false
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-stone-400"
                        )}
                        strokeWidth={1.75}
                      />
                      <div>
                        <p className="text-xs font-semibold text-stone-700 dark:text-white/70">
                          {s.isOpen !== false ? "Gerai buka" : "Gerai tutup"}
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-white/30">
                          Admin mengontrol status gerai
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={s.isOpen !== false ? "Tutup gerai" : "Buka gerai"}
                      onClick={() => {
                        const next = s.isOpen !== false ? false : true;
                        updateSeller(s.id, { isOpen: next });
                        toast(
                          next
                            ? `Gerai ${s.name} dibuka`
                            : `Gerai ${s.name} ditutup`,
                          next ? "success" : "info"
                        );
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                        s.isOpen !== false
                          ? "bg-emerald-500"
                          : "bg-stone-300 dark:bg-stone-600"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                          s.isOpen !== false ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
            {!state.sellers.length && (
              <p className="col-span-full py-12 text-center text-sm text-stone-500">
                Belum ada penjual
              </p>
            )}
          </div>
        )}

        {tab === "reports" && (
          <div className="mt-6">
            <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-stone-50 text-xs font-bold uppercase text-stone-500 dark:bg-stone-900">
                  <tr>
                    <th className="px-4 py-3">Penjual</th>
                    <th className="px-4 py-3">Pesanan</th>
                    <th className="px-4 py-3">Omzet</th>
                    <th className="px-4 py-3">Komisi</th>
                    <th className="px-4 py-3">Bersih penjual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {sellerReport.map((r) => (
                    <tr key={r.id} className="bg-white dark:bg-[#121a16]">
                      <td className="px-4 py-3 font-semibold">{r.name}</td>
                      <td className="px-4 py-3">{r.orderCount}</td>
                      <td className="px-4 py-3">{formatRupiah(r.gmv)}</td>
                      <td className="px-4 py-3 font-semibold text-[#047857] dark:text-[#10b981]">
                        {formatRupiah(r.commission)}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#047857] dark:text-[#10b981]">
                        {formatRupiah(r.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-50 font-bold dark:bg-stone-900">
                  <tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3">{stats.orders}</td>
                    <td className="px-4 py-3">{formatRupiah(stats.gmv)}</td>
                    <td className="px-4 py-3">{formatRupiah(stats.commission)}</td>
                    <td className="px-4 py-3">{formatRupiah(stats.sellerNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {tab === "pencairan" && (
          <div className="mt-6 space-y-4">
            {/* Stats ringkas */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Menunggu",
                  value: String(
                    state.withdrawals.filter((w) => w.status === "pending")
                      .length
                  ),
                  icon: Landmark,
                  color: "text-amber-600",
                },
                {
                  label: "Total fee platform",
                  value: formatRupiah(
                    state.withdrawals
                      .filter(
                        (w) => w.status === "approved" || w.status === "completed"
                      )
                      .reduce((n, w) => n + w.fee, 0)
                  ),
                  icon: Wallet,
                  color: "text-[#059669]",
                },
                {
                  label: "Total dicairkan",
                  value: formatRupiah(
                    state.withdrawals
                      .filter((w) => w.status === "completed")
                      .reduce((n, w) => n + w.netAmount, 0)
                  ),
                  icon: Send,
                  color: "text-blue-600",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-stone-200/80 bg-white p-4 dark:border-stone-800 dark:bg-[#121a16]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {s.label}
                    </p>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="mt-2 text-lg font-bold text-stone-900 dark:text-white">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Daftar request */}
            <div className="space-y-3">
              {!state.withdrawals.length ? (
                <div className="rounded-2xl border border-dashed border-stone-200 py-12 text-center dark:border-stone-800">
                  <Landmark className="mx-auto h-7 w-7 text-stone-500" />
                  <p className="mt-2 text-sm text-stone-500">
                    Belum ada request pencairan
                  </p>
                </div>
              ) : (
                state.withdrawals
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((w) => (
                    <div
                      key={w.id}
                      className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#121a16]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-stone-900 dark:text-white">
                              {w.sellerName}
                            </p>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                                w.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : w.status === "approved"
                                    ? "bg-blue-100 text-blue-700"
                                    : w.status === "completed"
                                      ? "bg-kantin-100 text-kantin-700"
                                      : "bg-red-100 text-red-600"
                              )}
                            >
                              {withdrawalStatusLabel(w.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-500">
                            {formatDate(w.createdAt)} ·{" "}
                            {withdrawalMethodLabel(w.method)}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {w.accountNumber} · {w.accountName}
                          </p>
                          {w.rejectReason && (
                            <p className="mt-1 text-xs text-red-500">
                              Alasan tolak: {w.rejectReason}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-stone-900 dark:text-white">
                            {formatRupiah(w.amount)}
                          </p>
                          <p className="text-xs text-stone-500">
                            Fee: {formatRupiah(w.fee)}
                          </p>
                          <p className="text-xs font-bold text-[#047857] dark:text-[#10b981]">
                            Diterima: {formatRupiah(w.netAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {w.status === "pending" && (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() => processWithdrawal(w.id, "approved")}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#059669] px-4 py-2 text-xs font-bold text-[#1c1917] transition hover:bg-[#047857]"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt("Alasan penolakan (opsional):");
                              processWithdrawal(w.id, "rejected", reason || undefined);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Tolak
                          </button>
                        </div>
                      )}
                      {w.status === "approved" && (
                        <div className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() => completeWithdrawal(w.id)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Tandai Selesai (Sudah Ditransfer)
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {tab === "pengumuman" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-[#121214] lg:col-span-2">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-[#059669]" />
                <h2 className="font-bold text-stone-900 dark:text-white">
                  Broadcast Pengumuman
                </h2>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Kirim pengumuman ke siswa & pedagang.
              </p>
              <div className="mt-5 space-y-3">
                <input
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Judul pengumuman"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                />
                <textarea
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Isi pengumuman…"
                  className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30"
                />
                <select
                  value={annAudience}
                  onChange={(e) =>
                    setAnnAudience(e.target.value as "all" | "sellers" | "buyers")
                  }
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 dark:border-white/10 dark:bg-[#1a1a1c] dark:text-white"
                >
                  <option value="all">Semua (siswa & pedagang)</option>
                  <option value="buyers">Pembeli / Siswa</option>
                  <option value="sellers">Penjual / Pedagang</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    addAnnouncement({ title: annTitle, body: annBody, audience: annAudience });
                    if (annTitle.trim() && annBody.trim()) {
                      setAnnTitle("");
                      setAnnBody("");
                    }
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#059669] px-5 py-2.5 text-sm font-bold text-[#1c1917] transition hover:bg-[#047857]"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                  Siarkan
                </button>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-3">
              {!state.settings.announcements?.length ? (
                <div className="rounded-2xl border border-dashed border-stone-200 py-12 text-center dark:border-stone-800">
                  <Megaphone className="mx-auto h-7 w-7 text-stone-500" />
                  <p className="mt-2 text-sm text-stone-500">
                    Belum ada pengumuman
                  </p>
                </div>
              ) : (
                state.settings.announcements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-[#121214]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 dark:text-white">{a.title}</p>
                        <p className="mt-0.5 text-xs text-stone-400">
                          {a.author} · {formatDate(a.createdAt)}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-white/70">
                          {a.body}
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:bg-white/10 dark:text-white/50">
                          {a.audience === "all"
                            ? "Semua"
                            : a.audience === "buyers"
                              ? "Pembeli"
                              : "Penjual"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAnnouncement(a.id)}
                        className="shrink-0 cursor-pointer rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10"
                        title="Hapus pengumuman"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DashboardShell>
    </PageTransition>
  );
}
