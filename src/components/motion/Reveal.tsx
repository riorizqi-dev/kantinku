"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Soft enter without blank first paint.
 * Never use opacity:0 as initial — that caused total black screen on first load
 * when framer-motion / hydration did not run animate in time.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  // No opacity gate — content must stay visible on first paint
  return <div className={cn(className)}>{children}</div>;
}

/** Page wrapper: never hide the whole page on enter */
export function PageTransition({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
