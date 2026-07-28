"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: "text-kantin-500",
  error: "text-red-500",
  info: "text-sky-500",
  warning: "text-amber-500",
};

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-2 px-0">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-white/95 p-4 shadow-xl shadow-stone-900/5 backdrop-blur-md dark:border-stone-700/80 dark:bg-stone-900/95 dark:shadow-black/30"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${colors[t.type]}`} />
              <p className="flex-1 text-sm font-medium text-stone-800 dark:text-stone-100">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="rounded-lg p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
