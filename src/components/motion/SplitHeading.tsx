"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Heading line-by-line. Text stays fully visible on first paint —
 * no overflow clip + y:100% (that hid the hero until animate ran).
 */
export function SplitHeading({
  text,
  className,
  as: Tag = "h1",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const lines = text.split("\n");
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <Tag className={cn(className)}>
        {lines.map((line, i) => (
          <span key={i} className="block pb-1">
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={cn(className)}>
      {lines.map((line, i) => (
        <span key={i} className="block pb-1">
          <motion.span
            className="block"
            initial={{ y: 10, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.05 + 0.08 * i, ease }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
