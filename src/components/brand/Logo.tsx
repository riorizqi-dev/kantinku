import { cn } from "@/lib/utils";

/** Tas geometris — line weight konsisten, tanpa dekorasi berlebih */
export function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
    >
      <path
        d="M6.5 8.5h11l.9 11.2a1.5 1.5 0 01-1.5 1.6H7.1a1.5 1.5 0 01-1.5-1.6L6.5 8.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.5V7a3 3 0 016 0v1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Alias untuk splash / loading */
export function LogoMark({ className }: { className?: string }) {
  return <BagIcon className={className} />;
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
          backgroundColor: color || "#f97316",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        <BagIcon className="h-[18px] w-[18px]" />
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
