import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Shell dashboard full-bleed seimbang.
 * Hindari max-w sempit + form mengambang di kiri.
 */
export function DashboardShell({
  children,
  className,
  /** dark = seller (hitam), light = admin/super */
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "min-h-[100dvh] w-full",
        tone === "dark"
          ? "bg-stone-100 text-stone-900 dark:bg-[#0a0a0b] dark:text-stone-100"
          : "bg-stone-50 text-stone-900 dark:bg-[#0a0a0b] dark:text-stone-100",
        className
      )}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-10">
        {children}
      </div>
    </div>
  );
}

/** Kartu konten full-width di dalam shell */
export function DashboardCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 dark:border-white/[0.08] dark:bg-[#121214]",
        className
      )}
    >
      {children}
    </div>
  );
}

export const dashInput =
  "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 transition focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-[#f97316]/15 dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-white/30";
