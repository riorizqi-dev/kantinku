"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  ClipboardList,
  Store,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { useApp } from "@/context/AppContext";
import {
  cn,
  formatDate,
  formatRupiah,
} from "@/lib/utils";
import type { SalesReport } from "@/lib/types";
import { PageTransition, Reveal } from "@/components/motion/Reveal";
import { DashboardShell, DashboardCard } from "@/components/layout/DashboardShell";

type Period = "today" | "week" | "month" | "all";

const PERIODS: Array<[Period, string]> = [
  ["today", "Hari ini"],
  ["week", "Minggu ini"],
  ["month", "Bulan ini"],
  ["all", "Semua"],
];

function periodStart(p: Period): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "today") return start.getTime();
  if (p === "week") {
    const dow = now.getDay() === 0 ? 7 : now.getDay();
    return start.getTime() - (dow - 1) * 86400000;
  }
  if (p === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }
  return 0;
}

function BendaharaDashboardInner() {
  const { state, verifySalesReport } = useApp();
  const [period, setPeriod] = useState<Period>("week");
  const [printName, setPrintName] = useState("Minggu ini");

  const sellerName = (id: string) =>
    state.sellers.find((s) => s.id === id)?.name || "—";

  const data = useMemo(() => {
    const start = periodStart(period);
    const inPeriod = (r: SalesReport) =>
      period === "all" || r.createdAt >= start;

    const list = state.salesReports
      .filter(inPeriod)
      .sort((a, b) => (b.date < a.date ? -1 : 1));

    const bySeller = new Map<
      string,
      { id: string; name: string; count: number; revenue: number; verified: number }
    >();
    for (const r of list) {
      const cur = bySeller.get(r.sellerId) || {
        id: r.sellerId,
        name: sellerName(r.sellerId),
        count: 0,
        revenue: 0,
        verified: 0,
      };
      cur.count += 1;
      cur.revenue += r.totalRevenue;
      if (r.status === "verified") cur.verified += 1;
      bySeller.set(r.sellerId, cur);
    }

    return {
      list,
      totalReports: list.length,
      totalRevenue: list.reduce((n, r) => n + r.totalRevenue, 0),
      verified: list.filter((r) => r.status === "verified").length,
      pending: list.filter((r) => r.status === "submitted").length,
      bySeller: Array.from(bySeller.values()).sort((a, b) => b.revenue - a.revenue),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.salesReports, period, state.sellers]);

  function exportXls() {
    const rows = data.list
      .map(
        (r) =>
          `<tr><td>${sellerName(r.sellerId)}</td><td>${r.date}</td><td>${r.items
            .map((i) => `${i.name} x${i.qty}`)
            .join(", ")}</td><td>${r.totalRevenue}</td><td>${
            r.status === "verified" ? "Diverifikasi" : "Menunggu"
          }</td></tr>`
      )
      .join("");

    const html = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="utf-8"></head>
      <body>
        <h3>Laporan Setoran Penjualan — ${state.settings.schoolName}</h3>
        <p>Periode: ${printName} &nbsp; Dicetak: ${formatDate(Date.now())}</p>
        <table border="1" cellpadding="4" cellspacing="0">
          <tr><th>Penjual</th><th>Tanggal</th><th>Item terjual</th><th>Total</th><th>Status</th></tr>
          ${rows}
        </table>
      </body></html>`;

    const blob = new Blob(["\ufeff", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan_setoran_${period}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    setPrintName(PERIODS.find((p) => p[0] === period)?.[1] || "Periode");
    setTimeout(() => window.print(), 100);
  }

  const stats = [
    {
      label: "Total laporan",
      value: String(data.totalReports),
      icon: ClipboardList,
      hint: "Semua penjual",
    },
    {
      label: "Total pendapatan",
      value: formatRupiah(data.totalRevenue),
      icon: Wallet,
      hint: "Periode terpilih",
    },
    {
      label: "Diverifikasi",
      value: String(data.verified),
      icon: CheckCircle2,
      hint: "Siap arsip",
    },
    {
      label: "Menunggu verifikasi",
      value: String(data.pending),
      icon: AlertCircle,
      hint: "Perlu dicek",
    },
  ];

  return (
    <DashboardShell tone="light">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#059669]/90">
              Bendahara
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
              Rekap Setoran Penjualan
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-white/40">
              {state.settings.schoolName} · verifikasi laporan harian semua
              penjual
            </p>
          </div>
          <div className="no-print flex flex-wrap items-center gap-2">
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
      </Reveal>

      {/* Kontrol periode */}
      <Reveal delay={0.05}>
        <div className="no-print mt-5 flex flex-wrap items-center gap-1.5">
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
                  ? "border-transparent bg-[#059669] text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 dark:hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Statistik */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-stone-200 bg-white p-4 dark:border-white/[0.07] dark:bg-[#121214]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-white/35">
                {s.label}
              </p>
              <s.icon className="h-4 w-4 text-[#059669]" strokeWidth={1.5} />
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

      {/* Rekap per penjual */}
      <DashboardCard className="report-print-area mt-6">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-[#059669]" />
          <h2 className="font-bold text-stone-900 dark:text-white">
            Rekap per Penjual
          </h2>
        </div>
        {data.bySeller.length === 0 ? (
          <p className="py-10 text-center text-sm text-stone-500 dark:text-white/40">
            Belum ada laporan setoran pada periode ini.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:bg-white/[0.03] dark:text-white/35">
                <tr>
                  <th className="px-4 py-2.5">Penjual</th>
                  <th className="px-4 py-2.5">Laporan</th>
                  <th className="px-4 py-2.5">Diverifikasi</th>
                  <th className="px-4 py-2.5">Total pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.04]">
                {data.bySeller.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 font-medium text-stone-800 dark:text-white/85">
                      {s.name}
                    </td>
                    <td className="px-4 py-2.5">{s.count}</td>
                    <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400">
                      {s.verified}
                    </td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-[#059669]">
                      {formatRupiah(s.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      {/* Daftar laporan */}
      <DashboardCard className="report-print-area mt-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-[#059669]" />
          <h2 className="font-bold text-stone-900 dark:text-white">
            Daftar Laporan Setoran ({data.list.length})
          </h2>
        </div>
        {data.list.length === 0 ? (
          <p className="py-10 text-center text-sm text-stone-500 dark:text-white/40">
            Tidak ada laporan pada periode ini.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.list.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-stone-200 p-4 dark:border-white/[0.07]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-stone-900 dark:text-white">
                        {sellerName(r.sellerId)}
                      </p>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:bg-white/10 dark:text-white/50">
                        {r.date}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          r.status === "verified"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        )}
                      >
                        {r.status === "verified" ? "Diverifikasi" : "Menunggu"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500 dark:text-white/45">
                      {r.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                    </p>
                    {r.notes && (
                      <p className="mt-1 text-xs italic text-stone-400 dark:text-white/30">
                        {r.notes}
                      </p>
                    )}
                    {r.status === "verified" && r.verifiedBy && (
                      <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        Diverifikasi oleh {r.verifiedBy} · {formatDate(r.verifiedAt || 0)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="font-bold tabular-nums text-[#059669]">
                      {formatRupiah(r.totalRevenue)}
                    </p>
                    {r.status === "submitted" && (
                      <button
                        type="button"
                        onClick={() => verifySalesReport(r.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#059669] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#047857]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verifikasi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      <div className="report-print-area mt-6 hidden print:block border-t border-stone-200 pt-4">
        <p className="text-sm text-stone-600">
          Periode: {printName} · Dicetak {formatDate(Date.now())}
        </p>
      </div>
    </DashboardShell>
  );
}

export default function BendaharaDashboardPage() {
  return (
    <RequireRole allow={["bendahara"]}>
      <PageTransition>
        <BendaharaDashboardInner />
      </PageTransition>
    </RequireRole>
  );
}