"use client";

import { MessageCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { normalizePhone } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

/**
 * Tombol "Hubungi Admin" — buka WhatsApp ke nomor platformWhatsapp
 * (diatur Super Admin). Sembunyi otomatis jika nomor belum diatur.
 */
export function ContactAdmin({
  variant = "footer",
  className,
}: {
  variant?: "footer" | "pill" | "icon";
  className?: string;
}) {
  const { state } = useApp();
  const phone = normalizePhone(state.settings.platformWhatsapp || "");
  if (phone.length < 10) return null;

  const message = buildContactAdminMessage(state.session, state);
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const target = phone.length >= 10 ? href : undefined;

  if (variant === "icon") {
    return (
      <a
        href={target}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi Admin"
        title="Hubungi Admin"
        className={cn(
          "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#f97316] transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-white/[0.06]",
          className
        )}
      >
        <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </a>
    );
  }

  if (variant === "pill") {
    return (
      <a
        href={target}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f97316] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#ea580c]",
          className
        )}
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
        Hubungi Admin
      </a>
    );
  }

  return (
    <a
      href={target}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-stone-400 transition-colors hover:text-[#f97316] dark:text-white/30 dark:hover:text-orange-400",
        className
      )}
    >
      <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
      Hubungi Admin
    </a>
  );
}

/**
 * Pesan otomatis ke admin — menyesuaikan peran pengguna.
 * - Customer/buyer: sebut nama + kelas
 * - Penjual (seller): sebut nama + nama lapak
 * - Admin/Superadmin: pesan internal
 * - Guest: pesan umum
 */
function buildContactAdminMessage(
  session: SessionUser | null,
  state: {
    sellers: { id: string; name: string }[];
  }
): string {
  if (!session) {
    return "Halo admin KantinKu, saya pengunjung dan ingin bertanya tentang KantinKu. Mohon dibantu ya.";
  }

  const name = session.name || session.username;
  const greet = `Halo admin KantinKu, saya *${name}*.`;

  switch (session.role) {
    case "buyer":
      return `${greet}\n\nSaya ${session.kelas ? `kelas ${session.kelas}, ` : ""}mau tanya soal pesanan di KantinKu. Mohon dibantu ya.`;
    case "seller": {
      const stall = state.sellers.find((s) => s.id === session.sellerId);
      const stallName = stall?.name ? ` dari lapak *${stall.name}*` : "";
      return `${greet}${stallName}, saya penjual di KantinKu.\n\nMau tanya/urus soal lapak & penjualan saya. Mohon dibantu ya.`;
    }
    case "admin":
    case "superadmin":
      return `${greet}\n\nIni terkait urusan internal pengelolaan KantinKu. Mohon dibantu ya.`;
    default:
      return `${greet}\n\nMohon dibantu ya.`;
  }
}
