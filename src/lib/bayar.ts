/**
 * Bayar.gg REST client (server-side only)
 *
 * Auth: X-API-Key
 * Base URL default: https://www.bayar.gg/api
 *
 * Windows/Node sering EAI_AGAIN / timeout:
 * - pakai DNS publik (8.8.8.8 / 1.1.1.1)
 * - resolve IPv4 dulu, connect ke IP + SNI (Host header)
 */

import dns from "node:dns";
import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* ignore */
}

// DNS publik — bantu saat DNS ISP/Windows flaky (EAI_AGAIN)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  /* ignore */
}

const FALLBACK_IP: Record<string, string> = {
  // Cadangan bila getaddrinfo gagal total (boleh stale; di-override resolve sukses)
  "www.bayar.gg": "95.169.180.225",
  "bayar.gg": "95.169.180.225",
};

export function getBayarConfig() {
  let baseUrl = (process.env.BAYAR_BASE_URL || "https://www.bayar.gg/api")
    .trim()
    .replace(/\/$/, "");

  if (baseUrl === "https://www.bayar.gg" || baseUrl === "https://bayar.gg") {
    baseUrl = `${baseUrl}/api`;
  }
  baseUrl = baseUrl.replace(/\/create-payment\.php$/i, "");

  // FORCE_IP hanya untuk dev lokal bermasalah DNS.
  // Di Vercel/production JANGAN pakai force IP (biar DNS cloud normal).
  const isVercel = process.env.VERCEL === "1";
  const forceIp = isVercel
    ? ""
    : (process.env.BAYAR_FORCE_IP || "").trim();

  const apiKey = (process.env.BAYAR_API_KEY || "").trim();
  const webhookSecret = (process.env.BAYAR_WEBHOOK_SECRET || "").trim();
  const paymentMethod = process.env.BAYAR_PAYMENT_METHOD || "qris";
  const useQrisConverter = process.env.BAYAR_USE_QRIS_CONVERTER !== "false";
  // Checkout URL aktif di akun Bayar.gg (default halaman hosted)
  const paymentUrl = (
    process.env.BAYAR_PAYMENT_URL ||
    process.env.NEXT_PUBLIC_BAYAR_PAYMENT_URL ||
    "https://www.bayar.gg/pay"
  )
    .trim()
    .replace(/\/$/, "")
    .replace(/\?invoice=.*$/i, "");

  return {
    baseUrl,
    apiKey,
    webhookSecret,
    paymentMethod,
    useQrisConverter,
    forceIp,
    paymentUrl,
  };
}

export interface CreateBayarPaymentInput {
  amount: number;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl?: string;
  redirectUrl?: string;
  paymentMethod?: string;
  useQrisConverter?: boolean;
  /** Checkout URL aktif di akun (wajib di API Bayar.gg terbaru) */
  paymentUrl?: string;
}

export interface CreateBayarPaymentResult {
  success: boolean;
  invoiceId?: string;
  paymentUrl?: string;
  /** Payload EMVCo QRIS — dipakai render QR di halaman (tanpa redirect) */
  qrisString?: string;
  amount?: number;
  finalAmount?: number;
  status?: string;
  expiresAt?: string;
  raw?: unknown;
  error?: string;
}

function formatNetworkError(err: unknown): string {
  const e = err as {
    message?: string;
    code?: string;
    cause?: { code?: string; message?: string };
  };
  const code = e?.cause?.code || e?.code || "";
  const msg = e?.cause?.message || e?.message || String(err);

  if (code === "EAI_AGAIN" || code === "ENOTFOUND" || /EAI_AGAIN|getaddrinfo/i.test(msg)) {
    return (
      "DNS Node gagal resolve bayar.gg (EAI_AGAIN). " +
      "Bukan salah API key. Coba: ganti DNS PC ke 8.8.8.8, matikan VPN, restart npm run dev. " +
      "Atau di .env.local tambah BAYAR_FORCE_IP=95.169.180.225 lalu restart. " +
      "Sementara pakai Bayar di Kantin."
    );
  }
  if (
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "ETIMEDOUT" ||
    /timeout/i.test(msg)
  ) {
    return (
      "Timeout koneksi ke Bayar.gg dari server. " +
      "Cek firewall/antivirus (izinkan node.exe), matikan VPN, restart dev server."
    );
  }
  if (code === "ECONNREFUSED" || code === "ECONNRESET") {
    return `Koneksi ke Bayar.gg terputus (${code}). Coba jaringan lain / hotspot HP.`;
  }
  if (code === "CERT_HAS_EXPIRED" || /certificate/i.test(msg)) {
    return "Masalah sertifikat SSL ke Bayar.gg.";
  }
  return `Tidak bisa terhubung ke Bayar.gg: ${msg}${code ? ` (${code})` : ""}`;
}

/** Resolve hostname → IPv4, dengan retry + fallback IP */
async function resolveIPv4(hostname: string, forceIp?: string): Promise<string> {
  if (forceIp) return forceIp;

  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await dns.promises.lookup(hostname, { family: 4 });
      if (r?.address) return r.address;
    } catch {
      // coba lagi
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }

  // Resolver manual via DNS Google (UDP)
  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);
    const addrs = await resolver.resolve4(hostname);
    if (addrs[0]) return addrs[0];
  } catch {
    /* ignore */
  }

  if (FALLBACK_IP[hostname]) return FALLBACK_IP[hostname];
  throw Object.assign(new Error(`getaddrinfo EAI_AGAIN ${hostname}`), {
    code: "EAI_AGAIN",
  });
}

/**
 * HTTP(S) request — connect ke IPv4 langsung, SNI + Host = hostname asli
 */
async function nodeRequest(
  urlStr: string,
  options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
    forceIp?: string;
  }
): Promise<{ status: number; text: string; headers: http.IncomingHttpHeaders }> {
  const url = new URL(urlStr);
  const isHttps = url.protocol === "https:";
  const lib = isHttps ? https : http;
  const timeoutMs = options.timeoutMs ?? 45000;
  const hostname = url.hostname;

  const ip = await resolveIPv4(hostname, options.forceIp);

  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      Host: hostname,
      ...(options.headers || {}),
    };

    const req = lib.request(
      {
        protocol: url.protocol,
        // Connect ke IP, bukan hostname (hindari getaddrinfo di layer connect)
        host: ip,
        servername: hostname, // TLS SNI
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method,
        headers,
        family: 4,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            text: Buffer.concat(chunks).toString("utf8"),
            headers: res.headers,
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(Object.assign(new Error("Request timeout"), { code: "ETIMEDOUT" }));
    });
    req.on("error", reject);

    if (options.body) req.write(options.body);
    req.end();
  });
}

function parseBayarResponse(
  status: number,
  text: string
): { data: Record<string, unknown>; error?: string } {
  const trimmed = text.trim();
  const looksHtml =
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    /maintenance|pemeliharaan/i.test(trimmed);

  if (looksHtml) {
    const isMaintenance = /maintenance|pemeliharaan/i.test(trimmed);
    return {
      data: {},
      error: isMaintenance
        ? "Bayar.gg sedang maintenance. Coba lagi nanti."
        : `Bayar.gg mengembalikan HTML (HTTP ${status}), bukan JSON. Cek Base URL.`,
    };
  }

  try {
    return { data: JSON.parse(text) as Record<string, unknown> };
  } catch {
    return {
      data: {},
      error: text.slice(0, 180) || `Respons tidak valid (HTTP ${status})`,
    };
  }
}

export async function createBayarPayment(
  input: CreateBayarPaymentInput
): Promise<CreateBayarPaymentResult> {
  const cfg = getBayarConfig();
  if (!cfg.apiKey) {
    return {
      success: false,
      error:
        "BAYAR_API_KEY belum di-set di .env.local (restart npm run dev setelah diisi)",
    };
  }

  // Bayar.gg API terbaru: payment_url (checkout page) WAJIB di request
  const checkoutUrl = (
    input.paymentUrl ||
    cfg.paymentUrl ||
    "https://www.bayar.gg/pay"
  ).replace(/\/$/, "");

  // callback_url hanya HTTPS (HTTP localhost ditolak)
  const callbackUrl =
    input.callbackUrl && /^https:\/\//i.test(input.callbackUrl)
      ? input.callbackUrl
      : undefined;
  const redirectUrl = input.redirectUrl || undefined;

  const body: Record<string, unknown> = {
    amount: Math.round(input.amount),
    description: input.description,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    payment_url: checkoutUrl,
    payment_method: input.paymentMethod || cfg.paymentMethod,
    use_qris_converter: input.useQrisConverter ?? cfg.useQrisConverter,
  };
  if (callbackUrl) body.callback_url = callbackUrl;
  if (redirectUrl) body.redirect_url = redirectUrl;

  const endpoint = `${cfg.baseUrl}/create-payment.php`;
  const bodyStr = JSON.stringify(body);

  const candidates = Array.from(
    new Set([
      endpoint,
      endpoint.replace("https://www.bayar.gg", "https://bayar.gg"),
      endpoint.replace("https://bayar.gg", "https://www.bayar.gg"),
    ])
  );

  let lastError: unknown;

  for (const url of candidates) {
    try {
      console.info("[bayar] create-payment →", url, "forceIp=", cfg.forceIp || "-");
      const res = await nodeRequest(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
          "X-API-Key": cfg.apiKey,
          "Content-Length": String(Buffer.byteLength(bodyStr)),
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
          Origin: "https://www.bayar.gg",
          Referer: "https://www.bayar.gg/",
        },
        body: bodyStr,
        timeoutMs: 45000,
        forceIp: cfg.forceIp || undefined,
      });

      const { data, error: parseError } = parseBayarResponse(
        res.status,
        res.text
      );

      if (parseError) {
        return {
          success: false,
          error: parseError,
          raw: { body: res.text.slice(0, 300), url },
        };
      }

      if (res.status >= 400 || data.success === false) {
        const errMsg =
          (typeof data.error === "string" && data.error) ||
          (typeof data.message === "string" && data.message) ||
          `Gagal create payment (HTTP ${res.status})`;
        return { success: false, error: errMsg, raw: data };
      }

      // Response shape: { success, data: {...} } ATAU { success, payment, payment_url }
      const nested = (data.data || data.payment || {}) as Record<
        string,
        unknown
      >;
      const invoiceId =
        (nested.invoice_id as string) ||
        (data.invoice_id as string) ||
        (data.transaction_id as string);
      const paymentUrl =
        (nested.payment_url as string) ||
        (data.payment_url as string) ||
        (invoiceId
          ? `${checkoutUrl}?invoice=${encodeURIComponent(invoiceId)}`
          : "");

      if (!paymentUrl) {
        return {
          success: false,
          error:
            "Bayar.gg tidak mengembalikan payment_url. Cek metode pembayaran & Checkout URL di dashboard.",
          raw: data,
        };
      }

      const qrisString = String(
        nested.qris_string ||
          nested.qrisString ||
          data.qris_string ||
          ""
      ).trim();

      return {
        success: true,
        invoiceId,
        paymentUrl,
        qrisString: qrisString || undefined,
        amount: Number(nested.amount ?? data.amount ?? input.amount),
        finalAmount: Number(
          nested.final_amount ??
            nested.amount ??
            data.final_amount ??
            input.amount
        ),
        status: String(nested.status || data.status || "pending"),
        expiresAt: (nested.expires_at || data.expires_at) as
          | string
          | undefined,
        raw: data,
      };
    } catch (err) {
      lastError = err;
      console.error("[bayar] create failed", url, err);
    }
  }

  return { success: false, error: formatNetworkError(lastError) };
}

export async function checkBayarPayment(invoiceId: string) {
  const cfg = getBayarConfig();
  if (!cfg.apiKey) {
    return { success: false as const, error: "BAYAR_API_KEY belum di-set" };
  }

  const url = new URL(`${cfg.baseUrl}/check-payment.php`);
  url.searchParams.set("invoice", invoiceId);

  try {
    const res = await nodeRequest(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": cfg.apiKey,
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      timeoutMs: 30000,
      forceIp: cfg.forceIp || undefined,
    });

    const { data, error: parseError } = parseBayarResponse(
      res.status,
      res.text
    );
    if (parseError) {
      return { success: false as const, error: parseError };
    }

    if (res.status >= 400 || data.success === false) {
      return {
        success: false as const,
        error:
          (typeof data.error === "string" && data.error) ||
          (typeof data.message === "string" && data.message) ||
          "Gagal cek status pembayaran",
        raw: data,
      };
    }

    return {
      success: true as const,
      invoiceId: String(data.invoice_id || invoiceId),
      status: String(data.status || "pending").toLowerCase(),
      amount: Number(data.amount || 0),
      finalAmount: Number(data.final_amount || data.amount || 0),
      paidAt: data.paid_at as string | undefined,
      paidReff: data.paid_reff_num as string | undefined,
      raw: data,
    };
  } catch (err) {
    return { success: false as const, error: formatNetworkError(err) };
  }
}

export async function verifyBayarWebhookSignature(params: {
  invoiceId: string;
  status: string;
  finalAmount: string | number;
  timestamp: string | number;
  signature: string;
  secret: string;
}): Promise<boolean> {
  if (!params.secret || !params.signature) return false;
  const crypto = await import("crypto");
  const payload = `${params.invoiceId}|${params.status}|${params.finalAmount}|${params.timestamp}`;
  const expected = crypto
    .createHmac("sha256", params.secret)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(params.signature)
    );
  } catch {
    return expected === params.signature;
  }
}
