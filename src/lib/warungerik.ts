/**
 * WarungErik Pay (pg.warungerik.com) REST client (server-side only)
 *
 * Auth: X-API-KEY header
 * Base URL default: https://pg.warungerik.com
 *
 * Endpoint:
 *  - POST /api/checkout                 → buat invoice QRIS dinamis
 *  - GET  /api/v1/order/:orderId        → cek status settlement (polling)
 *
 * Docs: https://pg.warungerik.com/api-docs
 */

const DEFAULT_BASE_URL = "https://pg.warungerik.com";
const REQUEST_TIMEOUT_MS = 45000;

export type WarungerikConfig = {
  baseUrl: string;
  apiKey: string;
};

export function getWarungerikConfig(): WarungerikConfig {
  const baseUrl = (process.env.WARUNGERIK_BASE_URL || DEFAULT_BASE_URL)
    .trim()
    .replace(/\/$/, "");
  const apiKey = (process.env.WARUNGERIK_API_KEY || "").trim();
  return { baseUrl, apiKey };
}

export interface CreateWarungerikPaymentInput {
  orderId: string;
  amount: number;
  customerName: string;
  customerPhone?: string;
  /** Catatan/deskripsi pesanan → dikirim sebagai `note` */
  description?: string;
}

export interface CreateWarungerikPaymentResult {
  success: boolean;
  /** same as orderId */
  invoiceId?: string;
  paymentUrl?: string;
  /** EMVCo QRIS string — dipakai render QR di halaman tanpa redirect */
  qrisString?: string;
  /** data:image/png;base64,... — QR siap tampil langsung dari gateway */
  qrDataUrl?: string;
  amount?: number;
  finalAmount?: number;
  status?: string;
  expiresAt?: string;
  raw?: unknown;
  error?: string;
}

export interface CheckWarungerikPaymentResult {
  success: boolean;
  invoiceId?: string;
  status?: string;
  amount?: number;
  finalAmount?: number;
  paidAt?: string;
  paidReff?: string;
  raw?: unknown;
  error?: string;
}

function formatNetworkError(err: unknown): string {
  const e = err as { name?: string; code?: string; message?: string };
  const msg = e?.message || String(err);

  if (e?.name === "AbortError" || /timeout|timed out/i.test(msg)) {
    return "Timeout menghubungi WarungErik. Coba lagi atau periksa koneksi internet.";
  }
  if (/fetch failed|EAI_AGAIN|getaddrinfo|ENOTFOUND/i.test(msg)) {
    return "Tidak bisa terhubung ke WarungErik (jaringan/DNS). Periksa koneksi internet, VPN, atau firewall.";
  }
  if (/ECONNREFUSED|ECONNRESET/i.test(msg)) {
    return "Koneksi ke WarungErik terputus. Coba jaringan lain.";
  }
  if (/429/i.test(msg)) {
    return "Terlalu banyak permintaan ke WarungErik. Coba beberapa saat lagi.";
  }
  return `Tidak bisa terhubung ke WarungErik: ${msg}`;
}

async function warungerikFetch(
  path: string,
  init: { method: string; body?: string }
): Promise<{ status: number; data: Record<string, unknown>; text: string }> {
  const cfg = getWarungerikConfig();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${cfg.baseUrl}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-KEY": cfg.apiKey,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      body: init.body,
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = {};
    }
    return { status: res.status, data, text };
  } catch (err) {
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function unwrapData(
  data: Record<string, unknown>
): Record<string, unknown> | null {
  if (data && typeof data === "object" && data.data && typeof data.data === "object") {
    return data.data as Record<string, unknown>;
  }
  return null;
}

/** POST /api/checkout — buat invoice QRIS dinamis */
export async function createWarungerikPayment(
  input: CreateWarungerikPaymentInput
): Promise<CreateWarungerikPaymentResult> {
  const cfg = getWarungerikConfig();
  if (!cfg.apiKey) {
    return {
      success: false,
      error:
        "WARUNGERIK_API_KEY belum di-set di .env.local (restart npm run dev setelah diisi).",
    };
  }

  const body = {
    orderId: input.orderId,
    amount: Math.round(input.amount),
    customerName: input.customerName,
    ...(input.customerPhone ? { customerPhone: input.customerPhone } : {}),
    note: input.description || `KantinKu ${input.orderId}`,
  };

  try {
    const { status, data } = await warungerikFetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const payload = unwrapData(data);

    if (status === 401) {
      return {
        success: false,
        error:
          "API key WarungErik ditolak (401). Periksa WARUNGERIK_API_KEY di .env.local.",
        raw: data,
      };
    }
    if (status >= 400 || data.success === false) {
      return {
        success: false,
        error:
          (typeof data.message === "string" && data.message) ||
          (typeof data.error === "string" && data.error) ||
          `Gagal membuat pembayaran WarungErik (HTTP ${status})`,
        raw: data,
      };
    }

    const orderId = String(payload?.orderId || "");
    const paymentUrl = String(payload?.paymentUrl || "");
    if (!orderId || !paymentUrl) {
      return {
        success: false,
        error: "WarungErik tidak mengembalikan paymentUrl. Coba lagi.",
        raw: data,
      };
    }

    const amount = Number(payload?.baseAmount ?? payload?.amount ?? input.amount);
    const finalAmount = Number(
      payload?.totalAmount ?? payload?.finalAmount ?? amount
    );

    return {
      success: true,
      invoiceId: orderId,
      paymentUrl,
      qrisString:
        String(payload?.dynamicQris || payload?.qrisString || "").trim() ||
        undefined,
      qrDataUrl: String(payload?.qrCodeDataUrl || "").trim() || undefined,
      amount,
      finalAmount,
      status: String(payload?.status || "PENDING"),
      expiresAt: payload?.expiredAt as string | undefined,
      raw: data,
    };
  } catch (err) {
    return { success: false, error: formatNetworkError(err) };
  }
}

/** GET /api/v1/order/:orderId — cek status settlement (polling) */
export async function checkWarungerikPayment(
  orderId: string
): Promise<CheckWarungerikPaymentResult> {
  const cfg = getWarungerikConfig();
  if (!cfg.apiKey) {
    return {
      success: false,
      error:
        "WARUNGERIK_API_KEY belum di-set di .env.local (restart npm run dev setelah diisi).",
    };
  }

  try {
    const { status, data } = await warungerikFetch(
      `/api/v1/order/${encodeURIComponent(orderId)}`,
      { method: "GET" }
    );

    const payload = unwrapData(data);

    if (status === 401) {
      return {
        success: false,
        error:
          "API key WarungErik ditolak (401). Periksa WARUNGERIK_API_KEY di .env.local.",
        raw: data,
      };
    }
    if (status === 404) {
      return {
        success: false,
        error: "Order tidak ditemukan di WarungErik.",
        raw: data,
      };
    }
    if (status >= 400 || data.success === false) {
      return {
        success: false,
        error:
          (typeof data.message === "string" && data.message) ||
          (typeof data.error === "string" && data.error) ||
          `Gagal cek status pembayaran (HTTP ${status})`,
        raw: data,
      };
    }

    return {
      success: true,
      invoiceId: String(payload?.orderId || orderId),
      status: String((payload?.status || "PENDING") as string).toLowerCase(),
      amount: Number(payload?.baseAmount ?? payload?.amount ?? 0),
      finalAmount: Number(payload?.totalAmount ?? payload?.finalAmount ?? 0),
      paidAt: payload?.paidAt as string | undefined,
      paidReff: payload?.txId as string | undefined,
      raw: data,
    };
  } catch (err) {
    return { success: false, error: formatNetworkError(err) };
  }
}