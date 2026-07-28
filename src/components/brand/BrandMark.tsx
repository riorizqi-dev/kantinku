import { cn } from "@/lib/utils";

/**
 * Bintang geometris premium — 4-point diamond star
 * Sharp, restrained, high-end brand mark (bukan sparkle / emoji)
 */
export function BrandStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-3.5 w-3.5", className)}
      aria-hidden="true"
    >
      {/* Cross-axis diamond — balanced, architectural */}
      <path
        d="M8 1.25L9.15 6.85L14.75 8L9.15 9.15L8 14.75L6.85 9.15L1.25 8L6.85 6.85L8 1.25Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
      {/* Hairline inner cut for craft depth */}
      <path
        d="M8 4.2L8.55 7.45L11.8 8L8.55 8.55L8 11.8L7.45 8.55L4.2 8L7.45 7.45L8 4.2Z"
        fill="currentColor"
        fillOpacity="0.25"
      />
    </svg>
  );
}

/** Badge kecil untuk hero / brand label */
export function BrandBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-white/80 px-3 py-1.5 text-[11px] font-medium tracking-[0.12em] text-stone-600 backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70",
        className
      )}
    >
      <span className="uppercase">{children}</span>
    </span>
  );
}
