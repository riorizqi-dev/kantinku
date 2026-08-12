import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

export function StoreIcon({ className }: { className?: string }) {
  return <Store className={cn("h-5 w-5", className)} strokeWidth={1.5} />;
}

export function LogoMark({ className }: { className?: string }) {
  return <StoreIcon className={className} />;
}

/**
 * Wordmark + bag — dark glass nav friendly
 * Accepts optional `color` prop to theme the icon background per stall.
 */
export function Logo({ className, color }: { className?: string; color?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#1c1917]"
        style={{
          backgroundColor: color || "#FFB300",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        <StoreIcon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex flex-col justify-center leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-stone-900 dark:text-white">
          KantinKu
        </span>
        <span className="mt-[3px] text-[10px] font-medium tracking-[0.04em] text-stone-500 dark:text-white/45">
          SMK Negeri 17
        </span>
      </span>
    </span>
  );
}
