import type { Order, PlatformSettings, Seller } from "./types";
import {
  formatDate,
  formatRupiah,
  normalizePhone,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from "./utils";

/**
 * Nomor WhatsApp PENJUAL / kantin (tujuan chat).
 * Prioritas:
 * 1. phone di data seller (pengaturan dashboard penjual)
 * 2. platformWhatsapp (super admin)
 * 3. NEXT_PUBLIC_SELLER_WHATSAPP / NEXT_PUBLIC_KANTIN_WHATSAPP di env
 *
 * JANGAN pakai order.buyerPhone — itu nomor customer.
 */
export function resolveSellerWhatsApp(params: {
  order: Order;
  sellers: Seller[];
  settings?: PlatformSettings | null;
}): string {
  const seller = params.sellers.find((s) => s.id === params.order.sellerId);
  const envPhone =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_SELLER_WHATSAPP ||
        process.env.NEXT_PUBLIC_KANTIN_WHATSAPP)) ||
    "";

  const candidates = [
    seller?.phone?.trim(),
    params.settings?.platformWhatsapp?.trim(),
    envPhone.trim(),
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const n = normalizePhone(raw);
    if (n.length >= 10) return n;
  }
  return "";
}

/**
 * Pesan dari CUSTOMER → PENJUAL (invoice pesanan)
 */
export function buildOrderToSellerMessage(order: Order): string {
  const lines = order.items
    .map((i) => `• ${i.name} x${i.qty} = ${formatRupiah(i.price * i.qty)}`)
    .join("\n");

  const payMethod = paymentMethodLabel(order.paymentMethod);

  return [
    "*PESANAN BARU — KantinKu*",
    "========================",
    `Halo *${order.sellerName}*,`,
    "Ada pesanan baru dari customer:",
    "",
    `*No. Pesanan:* ${order.orderNumber}`,
    `*Nama:* ${order.buyerName}`,
    `*Kelas:* ${order.buyerClass}`,
    order.buyerPhone ? `*WA Customer:* ${order.buyerPhone}` : null,
    "------------------------",
    "*Detail item:*",
    lines,
    "------------------------",
    `*Total:* ${formatRupiah(order.total)}`,
    `*Metode bayar:* ${payMethod}`,
    `*Status bayar:* ${paymentStatusLabel(order.paymentStatus)}`,
    `*Status pesanan:* ${orderStatusLabel(order.status)}`,
    order.notes ? `*Catatan:* ${order.notes}` : null,
    "========================",
    formatDate(order.createdAt),
    "",
    "_Pesan ini dikirim customer lewat KantinKu._",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Pesan dari PENJUAL → CUSTOMER (update status)
 * Hanya dipakai di dashboard penjual.
 */
export function buildOrderToBuyerMessage(order: Order): string {
  const lines = order.items
    .map((i) => `• ${i.name} x${i.qty} = ${formatRupiah(i.price * i.qty)}`)
    .join("\n");

  return [
    "*UPDATE PESANAN — KantinKu*",
    "========================",
    `No: ${order.orderNumber}`,
    `Halo ${order.buyerName},`,
    `Pesanan Anda dari *${order.sellerName}* status: *${orderStatusLabel(order.status)}*`,
    "------------------------",
    lines,
    "------------------------",
    `Total: ${formatRupiah(order.total)}`,
    order.status === "ready"
      ? "Pesanan sudah *SIAP DIAMBIL* di kantin. Silakan datang ke counter."
      : null,
    "========================",
    formatDate(Date.now()),
  ]
    .filter(Boolean)
    .join("\n");
}

/** @deprecated pakai buildOrderToSellerMessage / buildOrderToBuyerMessage */
export function buildOrderWhatsAppMessage(
  order: Order,
  audience: "seller" | "buyer"
): string {
  return audience === "seller"
    ? buildOrderToSellerMessage(order)
    : buildOrderToBuyerMessage(order);
}

export function openWhatsApp(phone: string, message: string) {
  const p = normalizePhone(phone);
  if (!p || p.length < 10) {
    throw new Error(
      "Nomor WhatsApp penjual belum diatur. Minta admin/penjual mengisi nomor WA di pengaturan kantin."
    );
  }
  // https://wa.me/62xxxxxxxxxx?text=...
  const url = `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}

/**
 * Customer kirim invoice ke penjual
 */
export function openOrderWhatsAppToSeller(params: {
  order: Order;
  sellers: Seller[];
  settings?: PlatformSettings | null;
}): string {
  const phone = resolveSellerWhatsApp(params);
  if (!phone) {
    throw new Error(
      "Nomor WhatsApp kantin/penjual belum diatur. Hubungi penjual atau isi di Pengaturan dashboard penjual."
    );
  }
  const message = buildOrderToSellerMessage(params.order);
  return openWhatsApp(phone, message);
}
