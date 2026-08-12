"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Wallet,
  Receipt,
  Package,
} from "lucide-react";
import type { Order } from "@/lib/types";
import {
  formatDate,
  formatRupiah,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  cn,
} from "@/lib/utils";

const PERIODS = [
  ["today", "Hari ini"],
  ["7d", "7 hari terakhir"],
  ["thisMonth", "Bulan ini"],
  ["30d", "30 hari"],
  ["all", "Semua"],
] as const;

type Period = (typeof PERIODS)[number][0];

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function periodStart(period: Period): number {
  const now = new Date();
  switch (period) {
    case "today":
      return startOfDay(now);
    case "7d":
      return now.getTime() - 7 * 86400000;
    case "thisMonth":
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    case "30d":
      return now.getTime() - 30 * 86400000;
    default:
      return 0;
  }
}

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function SellerReport({
  orders,
  sellerName,
}: {
  orders: Order[];
  sellerName: string;
}) {
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [printName, setPrintName] = useState("");

  const data = useMemo(() => {
    const start = periodStart(period);
    const list = orders
      .filter(
        (o) =>
          o.paymentStatus === "paid" &&
          o.status !== "cancelled" &&
          o.createdAt >= start
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    const summary = list.reduce(
      (acc, o) => {
        acc.count += 1;
        acc.subtotal += o.subtotal;
        acc.commission += o.commissionAmount;
        acc.net += o.sellerAmount;
        acc.qty += o.items.reduce((n, it) => n + it.qty, 0);
        return acc;
      },
      { count: 0, subtotal: 0, commission: 0, net: 0, qty: 0 }
    );

    const byDay = new Map<
      string,
      { label: string; count: number; subtotal: number; commission: number; net: number }
    >();
    for (const o of list) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const label = `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${d.toLocaleString(
        "id-ID",
        { month: "short" }
      )}`;
      const cur = byDay.get(key) || {
        label,
        count: 0,
        subtotal: 0,
        commission: 0,
        net: 0,
      };
      cur.count += 1;
      cur.subtotal += o.subtotal;
      cur.commission += o.commissionAmount;
      cur.net += o.sellerAmount;
      byDay.set(key, cur);
    }
    const days = Array.from(byDay.entries(), ([, v]) => ({ ...v })).sort(
      (a, b) => (a.label < b.label ? -1 : 1)
    );

    const itemMap = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >();
    for (const o of list) {
      for (const it of o.items) {
        const cur = itemMap.get(it.name) || { name: it.name, qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += it.price * it.qty;
        itemMap.set(it.name, cur);
      }
    }
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    return { list, summary, days, topItems, start };
  }, [orders, period]);

  const periodLabel =
    PERIODS.find((p) => p[0] === period)?.[1] || "Periode";

  const scope = (n: number) => n.toLocaleString("id-ID");

  function exportXls() {
    const rows = data.list
      .map(
        (o) =>
          `<tr><td>${o.orderNumber}</td><td>${formatDate(o.createdAt)}</td><td>${o.buyerName}</td><td>${o.items
            .map((i) => `${i.name} x${i.qty}`)
            .join(", ")}</td><td>${o.subtotal}</td><td>${o.commissionAmount}</td><td>${o.sellerAmount}</td><td>${orderStatusLabel(
            o.status
          )}</td><td>${paymentMethodLabel(o.paymentMethod)}</td></tr>`
      )
      .join("");

    const dailyRows = data.days
      .map(
        (d) =>
          `<tr><td>${d.label}</td><td>${d.count}</td><td>${d.subtotal}</td><td>${d.commission}</td><td>${d.net}</td></tr>`
      )
      .join("");

    const itemRows = data.topItems
      .map(
        (i) =>
          `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.revenue}</td></tr>`
      )
      .join("");

    const html = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="utf-8"></head>
      <body>
        <h3>Laporan KantinKu - ${sellerName}</h3>
        <p>Periode: ${periodLabel} &nbsp; Dicetak: ${formatDate(Date.now())}</p>
        <table border="1" cellpadding="4" cellspacing="0">
          <tr><th colspan="2" align="left">Ringkasan</th></tr>
          <tr><td>Pesanan lunas</td><td>${data.summary.count}</td></tr>
          <tr><td>Item terjual</td><td>${data.summary.qty}</td></tr>
          <tr><td>Omzet kotor</td><td>${data.summary.subtotal}</td></tr>
          <tr><td>Komisi platform</td><td>${data.summary.commission}</td></tr>
          <tr><td>Pendapatan bersih (laba)</td><td>${data.summary.net}</td></tr>
        </table>
        <br/>
        <table border="1" cellpadding="4" cellspacing="0">
          <tr><th>Tanggal</th><th>Pesanan</th><th>Omzet</th><th>Komisi</th><th>Bersih</th></tr>
          ${dailyRows}
        </table>
        <br/>
        <table border="1" cellpadding="4" cellspacing="0">
          <tr><th>Menu</th><th>Terjual</th><th>Pendapatan</th></tr>
          ${itemRows}
        </table>
        <br/>
        <table border="1" cellpadding="4" cellspacing="0">
          <tr><th>No. Pesanan</th><th>Tanggal</th><th>Pembeli</th><th>Item</th><th>Subtotal</th><th>Komisi</th><th>Bersih</th><th>Status</th><th>Metode</th></tr>
          ${rows}
        </table>
      </body></html>`;

    const blob = new Blob(["\ufeff", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan_${sellerName.replace(/\s+/g, "_")}_${period}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    setPrintName(periodLabel);
    setTimeout(() => window.print(), 100);
  }

  const statCards = [
    {
      label: "Omzet kotor",
      value: formatRupiah(data.summary.subtotal),
      icon: Wallet,
      hint: `${data.summary.count} pesanan · ${data.summary.qty} item`,
    },
    {
      label: "Komisi platform",
      value: formatRupiah(data.summary.commission),
      icon: Receipt,
      hint: "Potongan platform",
    },
    {
      label: "Pendapatan bersih (laba)",
      value: formatRupiah(data.summary.net),
      icon: TrendingUp,
      hint: "Setelah komisi",
    },
    {
      label: "Rata-rata per pesanan",
      value: formatRupiah(
        data.summary.count ? Math.round(data.summary.net / data.summary.count) : 0
      ),
      icon: BarChart3,
      hint: "Bersih / pesanan",
    },
  ];

  return (
    <div>
      {/* Kontrol (tidak ikut cetak) */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <CalendarDays
            className="h-4 w-4 text-stone-400 dark:text-white/35"
            strokeWidth={1.5}
          />
          {PERIODS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              className={cn(
                "cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                period === id
                  ? "border-transparent bg-[#FFB300] text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 dark:hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportXls}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-green-600/40 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.75} />
            Export Excel
          </button>
          <button
            type="button"
            onClick={printPdf}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Area yang dicetak ke PDF */}
      <div className="report-print-area">
        <div className="mb-4 hidden print:block">
          <h1 className="text-xl font-bold">Laporan KantinKu — {sellerName}</h1>
          <p className="text-sm text-stone-600">
            Periode: {printName} · Dicetak {formatDate(Date.now())}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-stone-200 bg-white p-4 dark:border-white/[0.07] dark:bg-[#121214]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-white/35">
                  {s.label}
                </p>
                <s.icon className="h-4 w-4 text-[#FFB300]" strokeWidth={1.5} />
              </div>
              <p className="mt-1.5 text-lg font-bold text-stone-900 dark:text-white">
                {s.value}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-400 dark:text-white/30">
                {s.hint}
              </p>
            </div>
          ))}
        </div>

        {/* Rincian per hari */}
        <div className="mt-6 overflow-hidden rounded-xl border border-stone-200 dark:border-white/[0.07]">
          <div className="border-b border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/40">
            Rincian per hari
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.03] dark:text-white/35">
                <tr>
                  <th className="px-4 py-2.5">Tanggal</th>
                  <th className="px-4 py-2.5">Pesanan</th>
                  <th className="px-4 py-2.5">Omzet</th>
                  <th className="px-4 py-2.5">Komisi</th>
                  <th className="px-4 py-2.5">Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.04]">
                {data.days.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-400 dark:text-white/30">
                      Belum ada transaksi pada periode ini
                    </td>
                  </tr>
                ) : (
                  data.days.map((d) => (
                    <tr key={d.label}>
                      <td className="px-4 py-2 text-stone-700 dark:text-white/75">{d.label}</td>
                      <td className="px-4 py-2">{d.count}</td>
                      <td className="px-4 py-2 tabular-nums">{formatRupiah(d.subtotal)}</td>
                      <td className="px-4 py-2 tabular-nums">{formatRupiah(d.commission)}</td>
                      <td className="px-4 py-2 font-semibold tabular-nums text-[#FFB300]">
                        {formatRupiah(d.net)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top menu */}
        {data.topItems.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-stone-200 dark:border-white/[0.07]">
            <div className="border-b border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/40">
              Menu terlaris (periode ini)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.03] dark:text-white/35">
                  <tr>
                    <th className="px-4 py-2.5">Menu</th>
                    <th className="px-4 py-2.5">Terjual</th>
                    <th className="px-4 py-2.5">Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/[0.04]">
                  {data.topItems.map((i) => (
                    <tr key={i.name}>
                      <td className="px-4 py-2 text-stone-700 dark:text-white/75">{i.name}</td>
                      <td className="px-4 py-2">{scope(i.qty)}</td>
                      <td className="px-4 py-2 tabular-nums">{formatRupiah(i.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Daftar pesanan */}
        <div className="mt-6 overflow-hidden rounded-xl border border-stone-200 dark:border-white/[0.07]">
          <div className="border-b border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/40">
            Daftar pesanan ({data.list.length})
          </div>
          {data.list.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone-400 dark:text-white/30">
              Tidak ada pesanan lunas pada periode ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.03] dark:text-white/35">
                  <tr>
                    <th className="px-4 py-2.5">No. Pesanan</th>
                    <th className="px-4 py-2.5">Tanggal</th>
                    <th className="px-4 py-2.5">Pembeli</th>
                    <th className="px-4 py-2.5">Item</th>
                    <th className="px-4 py-2.5">Subtotal</th>
                    <th className="px-4 py-2.5">Komisi</th>
                    <th className="px-4 py-2.5">Bersih</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Metode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/[0.04]">
                  {data.list.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-2 font-medium text-stone-800 dark:text-white/85">{o.orderNumber}</td>
                      <td className="px-4 py-2 text-xs text-stone-500 dark:text-white/40">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-2 text-stone-700 dark:text-white/75">{o.buyerName}</td>
                      <td className="max-w-[240px] truncate px-4 py-2 text-xs text-stone-500 dark:text-white/50">
                        {o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                      </td>
                      <td className="px-4 py-2 tabular-nums">{formatRupiah(o.subtotal)}</td>
                      <td className="px-4 py-2 tabular-nums">{formatRupiah(o.commissionAmount)}</td>
                      <td className="px-4 py-2 font-semibold tabular-nums text-[#FFB300]">
                        {formatRupiah(o.sellerAmount)}
                      </td>
                      <td className="px-4 py-2 text-xs">{orderStatusLabel(o.status)}</td>
                      <td className="px-4 py-2 text-xs">
                        {paymentMethodLabel(o.paymentMethod)} · {paymentStatusLabel(o.paymentStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm dark:border-white/[0.06]">
          <p className="text-stone-500 dark:text-white/40">
            Periode: <strong>{periodLabel}</strong> · dari {formatDate(data.start)}
          </p>
          <p className="inline-flex items-center gap-1.5 font-semibold text-[#FFB300]">
            <Package className="h-4 w-4" strokeWidth={1.75} />
            Laba bersih: {formatRupiah(data.summary.net)}
          </p>
        </div>
      </div>
    </div>
  );
}
