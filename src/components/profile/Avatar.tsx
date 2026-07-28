"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  style?: React.CSSProperties;
};

const sizes = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-20 w-20 text-lg",
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/** Avatar bulat — foto atau inisial */
export function Avatar({ name, avatar, size = "md", className, style }: Props) {
  const box = sizes[size];
  if (avatar?.startsWith("data:image") || avatar?.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name}
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-white/10",
          box,
          className
        )}
        style={style}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-stone-200 font-semibold text-stone-600 ring-1 ring-stone-300/80 dark:bg-white/[0.08] dark:text-white/70 dark:ring-white/10",
        box,
        className
      )}
      style={style}
      aria-label={name}
    >
      {name?.trim() ? (
        initials(name)
      ) : (
        <User className="h-[45%] w-[45%]" strokeWidth={1.5} />
      )}
    </span>
  );
}
