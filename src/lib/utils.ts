import { type ClassValue, clsx } from "clsx";
import type { OrderStatus, PaymentStatus, WithdrawalStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRupiah(n: number): string {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function calcCommission(subtotal: number, rate: number) {
  const commissionAmount = Math.round((subtotal * rate) / 100);
  const sellerAmount = subtotal - commissionAmount;
  return { commissionAmount, sellerAmount, total: subtotal };
}

export function orderStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    waiting: "Menunggu Diproses",
    processing: "Diproses",
    ready: "Siap Diambil",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return map[status];
}

export function paymentStatusLabel(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    unpaid: "Belum Bayar",
    pending: "Menunggu Pembayaran",
    paid: "Sudah Dibayar",
    failed: "Gagal",
    expired: "Kedaluwarsa",
  };
  return map[status];
}

export function paymentMethodLabel(method?: string): string {
  if (method === "canteen") return "Bayar di Kantin";
  if (method === "online") return "QRIS / Online";
  return "Pembayaran";
}

export function normalizePhone(phone: string): string {
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  if (p.startsWith("8")) p = "62" + p;
  return p;
}

export function withdrawalStatusLabel(status: WithdrawalStatus): string {
  const map: Record<WithdrawalStatus, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    completed: "Selesai",
  };
  return map[status];
}

export function withdrawalMethodLabel(method: string): string {
  const map: Record<string, string> = {
    bank: "Rekening Bank",
    dana: "DANA",
    ovo: "OVO",
    gopay: "GoPay",
  };
  return map[method] || method;
}
