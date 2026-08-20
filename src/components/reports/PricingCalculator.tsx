"use client";

import { useMemo, useState } from "react";
import { Calculator, Sparkles, TrendingUp, Check } from "lucide-react";
import type { Product } from "@/lib/types";
import {
  actualMarginPercent,
  fmtMoney,
  marketMedianPrice,
  profitPerUnit,
  suggestPriceFromCost,
} from "@/lib/pricing";

export function PricingCalculator({
  products,
  category,
  initialCost = 0,
  onApply,
  onClose,
}: {
  products: Product[];
  category: Product["category"];
  initialCost?: number;
  onApply: (price: number) => void;
  onClose: () => void;
}) {
  const [cost, setCost] = useState<string>(
    initialCost > 0 ? String(initialCost) : ""
  );
  const [margin, setMargin] = useState<string>("30");

  const costN = Number(cost) || 0;
  const marginN = Number(margin) || 0;
  const suggested = suggestPriceFromCost(costN, marginN);
  const market = marketMedianPrice(products, category);
  const profit = profitPerUnit(suggested, costN);
  const actual = actualMarginPercent(suggested, costN);

  const verdict = useMemo(() => {
    if (suggested <= 0) return null;
    if (!market)
      return {
        tone: "info",
        text: "Belum ada produk serupa untuk pembanding pasar.",
      };
    const diff = Math.round(((suggested - market) / market) * 100);
    if (suggested < market)
      return {
        tone: "good",
        text: `Harga ${fmtMoney(suggested)} lebih murah ${Math.abs(
          diff
        )}% dari harga pasar (${fmtMoney(market)}). Cepat laku.`,
      };
    if (suggested > market * 1.25)
      return {
        tone: "warn",
        text: `Harga ${fmtMoney(suggested)} jauh di atas pasar (${fmtMoney(
          market
        )}). Bisa kurang laku.`,
      };
    return {
      tone: "good",
      text: `Harga ${fmtMoney(suggested)} seimbang dengan pasar (${fmtMoney(
        market
      )}), selisih ${diff}%.`,
    };
  }, [suggested, market]);

  const toneColor = {
    good: "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    warn: "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    info: "border-stone-300 bg-stone-50 text-stone-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60",
  }[verdict?.tone || "info"];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-[#121214] sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-5 py-3.5 dark:border-white/[0.06] dark:bg-[#121214]">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#059669] text-white">
              <Calculator className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-bold">Kalkulator Harga AI</p>
              <p className="text-[11px] text-stone-400 dark:text-white/35">
                Saran harga jual dari modalmu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-white/45">
              Modal per unit (HPP)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-stone-400">
                Rp
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="cth. 5000"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm font-medium focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-stone-500 dark:text-white/45">
                Target margin laba
              </label>
              <span className="rounded bg-[#059669]/10 px-1.5 py-0.5 text-xs font-bold text-[#059669]">
                {marginN}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={70}
              step={5}
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className="w-full accent-[#059669]"
            />
            <div className="mt-1 flex justify-between text-[10px] text-stone-400 dark:text-white/30">
              <span>0%</span>
              <span>35%</span>
              <span>70%</span>
            </div>
          </div>

          {suggested > 0 && (
            <div className="rounded-xl border border-[#059669]/30 bg-gradient-to-br from-[#059669]/10 to-transparent p-4 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-white/40">
                Harga jual disarankan
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#059669]">
                {fmtMoney(suggested)}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-white/40">
                Laba {fmtMoney(profit)}/unit · margin {actual}%
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-stone-400 dark:text-white/35">
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" strokeWidth={1.75} />
                  {category}
                </span>
                {market > 0 && (
                  <span>Pasar: {fmtMoney(market)}</span>
                )}
              </div>
            </div>
          )}

          {verdict && (
            <div
              className={`rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${toneColor}`}
            >
              <span className="mr-1">•</span>
              {verdict.text}
            </div>
          )}

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-[11px] leading-relaxed text-stone-500 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white/45">
            <p className="mb-1 flex items-center gap-1 font-semibold">
              <Sparkles className="h-3 w-3 text-[#059669]" strokeWidth={1.75} />
              Cara baca
            </p>
            Harga dihitung dari <strong>modal / (1 − margin)</strong> lalu
            dibulatkan ke kelipatan Rp500 agar harga jajanan tetap{" "}
            <em>“bulat dan bersahabat”</em>. Pembanding diambil dari median
            harga terendah produk sejenis di katalog kantin.
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => costN > 0 && onApply(suggested)}
              disabled={suggested <= 0}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#059669] py-2.5 text-sm font-semibold text-white transition hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" strokeWidth={2} />
              Terapkan harga {suggested > 0 ? fmtMoney(suggested) : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
