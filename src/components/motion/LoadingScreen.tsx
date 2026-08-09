"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";

/**
 * Optional short splash. Does NOT gate page content (content renders underneath
 * and is never forced to opacity:0). Mounted only on client; if it never runs,
 * the real page is already visible — no blank black first paint.
 */
export function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setShow(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="kantinku-splash"
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-stone-100/95 dark:bg-[#0a0a0b]/95"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <motion.div
            initial={{ opacity: 1, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-5"
          >
            <LogoMark className="h-12 w-12 text-[#f97316] dark:text-[#fb923c]" />
            <div className="h-px w-16 overflow-hidden bg-stone-200 dark:bg-white/10">
              <motion.div
                className="h-full bg-[#f97316]/80 dark:bg-[#fb923c]/80"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-stone-500 dark:text-white/50">
              KantinKu
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
