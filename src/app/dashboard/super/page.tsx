"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Percent,
  Store,
  ShoppingBag,
  Users,
  Wallet,
  Shield,
  AlertTriangle,
  Landmark,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  cn,
  formatDate,
  formatRupiah,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/utils";
import { roleLabel } from "@/lib/roles";
import { PageTransition } from "@/components/motion/Reveal";
import {
  DashboardCard,
  DashboardShell,
  dashInput,
} from "@/components/layout/DashboardShell";

type Tab =
  | "overview"
  | "orders"
  | "sellers"
  | "accounts"
  | "settings";

/**
 * Dashboard Super Admin â€” layout full-width seimbang
 */
export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const {
    ready,
    state,
    updateSettings,
    addSellerUser,
    addAdminUser,
    updateSeller,
    resetAllData,
    toast,
  } = useApp();

  const [tab, setTab] = useState<Tab>("overview");
  const session = state.session;

  useEffect(() => {
    if (!ready) return;
    if (!session || session.role !== "superadmin") {
      router.replace("/login");
    }
  }, [ready, session, router]);

  const paidOrders = useMemo(
    () =>
      state.orders.filter(
        (o) => o.paymentStatus === "paid" && o.status !== "cancelled"
      ),
    [state.orders]
  );

  const stats = useMemo(() => {
    const gmv = paidOrders.reduce((n, o) => n + o.subtotal, 0);
    const commission = paidOrders.reduce((n, o) => n + o.commissionAmount, 0);
    const withdrawalFees = state.withdrawals
      .filter((w) => w.status === "approved" || w.status === "completed")
      .reduce((n, w) => n + w.fee, 0);
    return {
      orders: paidOrders.length,
      gmv,
      commission,
      sellers: state.sellers.length,
      admins: state.users.filter((u) => u.role === "admin").length,
      buyers: state.users.filter((u) => u.role === "buyer").length,
      products: state.products.length,
      pendingWithdrawals: state.withdrawals.filter((w) => w.status === "pending").length,
      withdrawalFees,
    };
  }, [paidOrders, state]);

  if (!ready || !session || session.role !== "superadmin") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-[#f97316]" />
      </div>
    );
  }

  function onCommission(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rate = Number(fd.get("commissionRate"));
    if (isNaN(rate) || rate < 0 || rate > 50) {
      toast("Komisi harus 0â€“50%", "error");
      return;
    }
    const withdrawalFeeValue = Number(fd.get("withdrawalFeeValue"));
    const withdrawalFeeType = String(fd.get("withdrawalFeeType") || "percent");
    if (
      withdrawalFeeType !== "percent" &&
      withdrawalFeeType !== "flat"
    ) {
      toast("Tipe fee pencairan tidak valid", "error");
      return;
    }
    if (withdrawalFeeType === "percent" && (isNaN(withdrawalFeeValue) || withdrawalFeeValue < 0 || withdrawalFeeValue > 50)) {
      toast("Fee pencairan (%) harus 0â€“50", "error");
      return;
    }
    if (withdrawalFeeType === "flat" && (isNaN(withdrawalFeeValue) || withdrawalFeeValue < 0)) {
      toast("Fee pencairan (flat) harus â‰¥ 0", "error");
      return;
    }
    updateSettings({
      commissionRate: rate,
      schoolName: String(fd.get("schoolName") || "").trim(),
      platformWhatsapp: String(fd.get("platformWhatsapp") || "").trim(),
      withdrawalFeeType: withdrawalFeeType as "percent" | "flat",
      withdrawalFeeValue,
    });
  }

  function onAddSeller(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const err = addSellerUser({
      name: String(fd.get("name") || ""),
      username: String(fd.get("username") || ""),
      password: String(fd.get("password") || ""),
      sellerName: String(fd.get("sellerName") || ""),
      phone: String(fd.get("phone") || ""),
    });
    if (err) toast(err, "error");
    else e.currentTarget.reset();
  }

  function onAddAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const err = addAdminUser({
      name: String(fd.get("name") || ""),
      username: String(fd.get("username") || ""),
      password: String(fd.get("password") || ""),
      phone: String(fd.get("phone") || ""),
    });
    if (err) toast(err, "error");
    else e.currentTarget.reset();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Transaksi" },
    { id: "sellers", label: "Penjual" },
    { id: "accounts", label: "Akun" },
    { id: "settings", label: "Komisi & Settings" },
  ];

  return (
    <PageTransition>
      <DashboardShell>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
          Super Admin
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900 dark:text-white">
          Platform Control
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-500">
          Monitoring, komisi, dan kelola akun. Produk & stok dikelola Penjual.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            {
              label: "Pendapatan platform",
              value: formatRupiah(stats.commission),
              icon: Wallet,
            },
            {
              label: "GMV",
              value: formatRupiah(stats.gmv),
              icon: ShoppingBag,
            },
            {
              label: "Penjual",
              value: String(stats.sellers),
              icon: Store,
            },
            {
              label: "Admin",
              value: String(stats.admins),
              icon: Shield,
            },
            {
              label: "Pencairan pending",
              value: String(stats.pendingWithdrawals),
              icon: Landmark,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-white/[0.08] dark:bg-[#121214]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  {s.label}
                </p>
                <s.icon className="h-4 w-4 shrink-0 text-[#f97316]" />
              </div>
              <p className="mt-2 text-lg font-bold text-stone-900 sm:text-xl dark:text-white">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-stone-200 pb-3 dark:border-white/[0.08]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                tab === t.id
                  ? "bg-[#f97316] text-[#1c1917] shadow-sm"
                  : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/[0.06]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* â€”â€”â€” OVERVIEW â€”â€”â€” */}
        {tab === "overview" && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DashboardCard className="md:col-span-1">
              <h2 className="font-bold text-stone-900 dark:text-white">
                Komisi platform
              </h2>
              <p className="mt-2 text-4xl font-semibold text-[#ea580c] dark:text-[#fb923c]">
                {state.settings.commissionRate}%
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                Dipotong dari setiap transaksi lunas. Pembeli bayar harga menu
                penuh; penjual menerima sisa setelah komisi.
              </p>
              <p className="mt-4 text-sm">
                Total komisi terkumpul:{" "}
                <strong>{formatRupiah(stats.commission)}</strong>
              </p>
            </DashboardCard>
            <DashboardCard>
              <h2 className="font-bold text-stone-900 dark:text-white">
                Ringkasan sistem
              </h2>
              <ul className="mt-3 space-y-2.5 text-sm text-stone-600 dark:text-stone-300">
                <li className="flex justify-between gap-4">
                  <span>Transaksi lunas</span>
                  <span className="font-bold">{stats.orders}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Produk (dikelola penjual)</span>
                  <span className="font-bold">{stats.products}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Pembeli terdaftar</span>
                  <span className="font-bold">{stats.buyers}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>GMV</span>
                  <span className="font-bold">{formatRupiah(stats.gmv)}</span>
                </li>
              </ul>
            </DashboardCard>
            <DashboardCard className="md:col-span-2 xl:col-span-1">
              <h2 className="font-bold text-stone-900 dark:text-white">
                Akses Super Admin
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-stone-600 dark:text-stone-300">
                <li>Â· Atur komisi & nama sekolah</li>
                <li>Â· Kelola semua nama lapak</li>
                <li>Â· Tambah admin & penjual</li>
                <li>Â· Monitoring transaksi</li>
              </ul>
              <p className="mt-4 text-xs font-semibold text-amber-700 dark:text-amber-400">
                Produk & stok = wewenang Penjual, bukan Super Admin.
              </p>
            </DashboardCard>
          </div>
        )}

        {/* â€”â€”â€” ORDERS â€”â€”â€” */}
        {tab === "orders" && (
          <div className="mt-6 space-y-3">
            {!state.orders.length ? (
              <DashboardCard>
                <p className="py-8 text-center text-sm text-stone-500">
                  Belum ada transaksi
                </p>
              </DashboardCard>
            ) : (
              state.orders.map((o) => (
                <DashboardCard key={o.id} className="!p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-stone-900 dark:text-white">
                        {o.orderNumber}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDate(o.createdAt)} Â· {o.sellerName}
                      </p>
                      <p className="mt-1 text-sm">
                        {o.buyerName} ({o.buyerClass})
                      </p>
                    </div>
                    <div className="text-right text-sm sm:min-w-[160px]">
                      <p className="font-bold text-[#ea580c] dark:text-[#fb923c]">
                        {formatRupiah(o.total)}
                      </p>
                      <p className="text-xs text-amber-600">
                        Komisi: {formatRupiah(o.commissionAmount)} (
                        {o.commissionRate}%)
                      </p>
                      <p className="text-xs text-stone-400">
                        Penjual: {formatRupiah(o.sellerAmount)}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {paymentStatusLabel(o.paymentStatus)} Â·{" "}
                        {orderStatusLabel(o.status)}
                      </p>
                    </div>
                  </div>
                </DashboardCard>
              ))
            )}
          </div>
        )}

        {/* â€”â€”â€” SELLERS â€”â€”â€” */}
        {tab === "sellers" && (
          <div className="mt-6 space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                let n = 0;
                for (const s of state.sellers) {
                  const name = String(fd.get(`name_${s.id}`) || "").trim();
                  const booth = String(fd.get(`booth_${s.id}`) || "").trim();
                  const phone = String(fd.get(`phone_${s.id}`) || "").trim();
                  if (!name) continue;
                  updateSeller(
                    s.id,
                    {
                      name,
                      booth: booth || undefined,
                      phone,
                    },
                    { silent: true }
                  );
                  n += 1;
                }
                toast(
                  n > 0
                    ? `${n} lapak diperbarui`
                    : "Tidak ada perubahan tersimpan"
                );
              }}
            >
              <DashboardCard className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-stone-900 dark:text-white">
                      Edit nama semua lapak
                    </h2>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Ubah sekalian di sini â€” tidak perlu login ke tiap akun
                      penjual.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-[#f97316] px-5 py-2.5 text-sm font-bold text-[#1c1917] transition hover:bg-[#ea580c]"
                  >
                    Simpan semua lapak
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-stone-100 dark:border-white/[0.06]">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:bg-white/[0.03]">
                      <tr>
                        <th className="px-3 py-2.5">Akun penjual</th>
                        <th className="px-3 py-2.5">Nama lapak</th>
                        <th className="px-3 py-2.5">Booth</th>
                        <th className="px-3 py-2.5">WhatsApp</th>
                        <th className="px-3 py-2.5">Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-white/[0.05]">
                      {state.sellers.map((s) => {
                        const owner = state.users.find(
                          (u) => u.id === s.ownerUserId
                        );
                        const gmv = paidOrders
                          .filter((o) => o.sellerId === s.id)
                          .reduce((n, o) => n + o.subtotal, 0);
                        return (
                          <tr key={s.id}>
                            <td className="px-3 py-3 align-middle">
                              <p className="font-semibold text-stone-800 dark:text-white/90">
                                {owner?.name || "â€”"}
                              </p>
                              <p className="text-[11px] text-stone-400">
                                @{owner?.username || "â€”"}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <input
                                name={`name_${s.id}`}
                                defaultValue={s.name}
                                required
                                className={dashInput}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                name={`booth_${s.id}`}
                                defaultValue={s.booth || ""}
                                placeholder="A1"
                                className={cn(dashInput, "max-w-[6rem]")}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                name={`phone_${s.id}`}
                                defaultValue={s.phone || ""}
                                placeholder="08..."
                                className={dashInput}
                              />
                            </td>
                            <td className="px-3 py-3 text-xs text-stone-500 whitespace-nowrap">
                              {formatRupiah(gmv)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </form>

            {/* Form tambah penjual â€” full width, field 2 kolom */}
            <form onSubmit={onAddSeller}>
              <DashboardCard>
                <h2 className="font-bold text-stone-900 dark:text-white">
                  Tambah Penjual
                </h2>
                <p className="mt-1 text-xs text-stone-500">
                  Buat akun + lapak baru. Login dipakai penjual untuk kelola
                  produk.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      ["sellerName", "Nama Kantin / Lapak", "text"],
                      ["name", "Nama akun penjual", "text"],
                      ["username", "Username", "text"],
                      ["password", "Password", "password"],
                      ["phone", "WhatsApp", "tel"],
                    ] as const
                  ).map(([name, label, type]) => (
                    <div
                      key={name}
                      className={
                        name === "phone" || name === "sellerName"
                          ? "sm:col-span-1"
                          : ""
                      }
                    >
                      <label className="mb-1.5 block text-xs font-bold text-stone-500">
                        {label}
                        {name !== "phone" ? " *" : ""}
                      </label>
                      <input
                        name={name}
                        required={name !== "phone"}
                        type={type}
                        className={dashInput}
                      />
                    </div>
                  ))}
                  <div className="flex items-end sm:col-span-2 lg:col-span-1">
                    <button
                      type="submit"
                      className="w-full rounded-full bg-[#f97316] py-2.5 text-sm font-bold text-[#1c1917] transition hover:bg-[#ea580c]"
                    >
                      Simpan Penjual
                    </button>
                  </div>
                </div>
              </DashboardCard>
            </form>
          </div>
        )}

        {/* â€”â€”â€” ACCOUNTS â€”â€”â€” */}
        {tab === "accounts" && (
          <div className="mt-6 grid gap-6 xl:grid-cols-5">
            <DashboardCard className="!p-0 overflow-hidden xl:col-span-3">
              <div className="border-b border-stone-100 px-5 py-4 dark:border-white/[0.06]">
                <h2 className="font-bold text-stone-900 dark:text-white">
                  Semua pengguna
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs font-bold uppercase text-stone-500 dark:bg-white/[0.03]">
                    <tr>
                      <th className="px-5 py-3">Pengguna</th>
                      <th className="px-5 py-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-white/[0.05]">
                    {state.users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-5 py-3">
                          <p className="font-semibold">{u.name}</p>
                          <p className="text-xs text-stone-400">
                            @{u.username}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold dark:bg-white/10">
                            {roleLabel(u.role)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardCard>

            <form onSubmit={onAddAdmin} className="xl:col-span-2">
              <DashboardCard className="h-full">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#f97316]" />
                  <h2 className="font-bold text-stone-900 dark:text-white">
                    Tambah Admin
                  </h2>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Admin dapat melihat pesanan & laporan, tanpa kelola produk.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {(
                    [
                      ["name", "Nama"],
                      ["username", "Username"],
                      ["password", "Password"],
                      ["phone", "WhatsApp"],
                    ] as const
                  ).map(([name, label]) => (
                    <div key={name}>
                      <label className="mb-1.5 block text-xs font-bold text-stone-500">
                        {label}
                        {name !== "phone" ? " *" : ""}
                      </label>
                      <input
                        name={name}
                        required={name !== "phone"}
                        type={name === "password" ? "password" : "text"}
                        minLength={name === "password" ? 6 : undefined}
                        className={dashInput}
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  className="mt-5 w-full rounded-full bg-[#f97316] py-2.5 text-sm font-bold text-[#1c1917] transition hover:bg-[#ea580c]"
                >
                  Simpan Admin
                </button>
              </DashboardCard>
            </form>
          </div>
        )}

        {/* â€”â€”â€” SETTINGS (prioritas full-width) â€”â€”â€” */}
        {tab === "settings" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <form onSubmit={onCommission} className="lg:col-span-3">
              <DashboardCard>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-[#f97316]" />
                  <h2 className="font-bold text-stone-900 dark:text-white">
                    Pengaturan platform
                  </h2>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Nama sekolah, komisi, dan kontak platform.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold text-stone-500">
                      Nama Platform / Sekolah
                    </label>
                    <input
                      name="schoolName"
                      defaultValue={state.settings.schoolName}
                      className={dashInput}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-stone-500">
                      Komisi Platform (%)
                    </label>
                    <input
                      name="commissionRate"
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      defaultValue={state.settings.commissionRate}
                      className={dashInput}
                    />
                    <p className="mt-1 text-[11px] text-stone-400">
                      0â€“50%. Saat ini {state.settings.commissionRate}%.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-stone-500">
                      WhatsApp Platform
                    </label>
                    <input
                      name="platformWhatsapp"
                      defaultValue={state.settings.platformWhatsapp}
                      placeholder="08xxxxxxxxxx"
                      className={dashInput}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-stone-500">
                      Fee Pencairan (Tipe)
                    </label>
                    <select
                      name="withdrawalFeeType"
                      defaultValue={state.settings.withdrawalFeeType}
                      className={dashInput}
                    >
                      <option value="percent">Persen (%)</option>
                      <option value="flat">Flat (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-stone-500">
                      {state.settings.withdrawalFeeType === "percent"
                        ? "Fee Pencairan (%)"
                        : "Fee Pencairan (Rp)"}
                    </label>
                    <input
                      name="withdrawalFeeValue"
                      type="number"
                      min={0}
                      max={state.settings.withdrawalFeeType === "percent" ? 50 : undefined}
                      step={state.settings.withdrawalFeeType === "percent" ? 0.5 : 100}
                      defaultValue={state.settings.withdrawalFeeValue}
                      className={dashInput}
                    />
                    <p className="mt-1 text-[11px] text-stone-400">
                      {state.settings.withdrawalFeeType === "percent"
                        ? `Saat ini ${state.settings.withdrawalFeeValue}%`
                        : `Saat ini ${formatRupiah(state.settings.withdrawalFeeValue)}`}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-[#f97316] px-6 py-2.5 text-sm font-bold text-[#1c1917] transition hover:bg-[#ea580c]"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </DashboardCard>
            </form>

            <div className="space-y-4 lg:col-span-2">
              <DashboardCard>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Ringkasan komisi
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone-500">Rate</dt>
                    <dd className="font-bold">
                      {state.settings.commissionRate}%
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone-500">Terkumpul</dt>
                    <dd className="font-bold text-[#ea580c] dark:text-[#fb923c]">
                      {formatRupiah(stats.commission)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone-500">GMV lunas</dt>
                    <dd className="font-semibold">
                      {formatRupiah(stats.gmv)}
                    </dd>
                  </div>
                </dl>
              </DashboardCard>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300">
                      Reset data lokal
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-red-700/80 dark:text-red-400/80">
                      Mengembalikan data browser ke kondisi awal (akun default +
                      produk seed). Tidak bisa dibatalkan.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Yakin reset semua data?")) resetAllData();
                      }}
                      className="mt-3 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                    >
                      Reset Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardShell>
    </PageTransition>
  );
}
