/**
 * Create payment WarungErik Pay dari BROWSER (fallback bila /api/bayar/create gagal).
 *
 * Hanya dipakai sebagai cadangan lokal. Di production (Vercel) cukup
 * WARUNGERIK_API_KEY server — key browser (NEXT_PUBLIC_) opsional.
 */

export type BrowserCreateResult =
  | {
      success: true;
      invoiceId: string;
      paymentUrl: string;
      qrisString?: string;
      qrDataUrl?: string;
      finalAmount?: number;
    }
  | { success: false; error: string };

function getBrowserConfig() {
  const apiKey = (
    process.env.NEXT_PUBLIC_WARUNGERIK_API_KEY ||
    process.env.NEXT_PUBLIC_WARUNGERIK_KEY ||
    ""
  ).trim();

  const baseUrl = (
    process.env.NEXT_PUBLIC_WARUNGERIK_BASE_URL ||
    "https://pg.warungerik.com"
  )
    .trim()
    .replace(/\/$/, "");

  return { apiKey, baseUrl };
}

export async function createWarungerikPaymentInBrowser(input: {
  orderId: string;
  amount: number;
  customerName: string;
  customerPhone?: string;
  description?: string;
}): Promise<BrowserCreateResult> {
  const cfg = getBrowserConfig();

  if (!cfg.apiKey) {
    return {
      success: false,
      error:
        "Tambahkan NEXT_PUBLIC_WARUNGERIK_API_KEY di .env.local (sama dengan WARUNGERIK_API_KEY), lalu restart npm run dev.",
    };
  }

  const jsonBody = {
    orderId: input.orderId,
    amount: Math.round(input.amount),
    customerName: input.customerName.slice(0, 80),
    ...(input.customerPhone ? { customerPhone: input.customerPhone } : {}),
    note: (input.description || `KantinKu ${input.orderId}`).slice(0, 120),
  };

  let lastError = "Gagal menghubungi WarungErik dari browser";

  try {
    const res = await fetch(`${cfg.baseUrl}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-KEY": cfg.apiKey,
      },
      body: JSON.stringify(jsonBody),
      mode: "cors",
      cache: "no-store",
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {
        success: false,
        error:
          res.type === "opaque"
            ? "Browser diblok CORS oleh WarungErik. Gunakan server route (default)."
            : `Respons bukan JSON (HTTP ${res.status})`,
      };
    }

    if (res.status === 401) {
      return {
        success: false,
        error:
          "API key WarungErik ditolak (401). Periksa NEXT_PUBLIC_WARUNGERIK_API_KEY.",
      };
    }
    if (!res.ok || data.success === false) {
      return {
        success: false,
        error:
          (typeof data.message === "string" && data.message) ||
          (typeof data.error === "string" && data.error) ||
          `HTTP ${res.status}`,
      };
    }

    const payload = (data.data && typeof data.data === "object"
      ? data.data
      : {}) as Record<string, unknown>;

    const invoiceId = String(payload.orderId || "");
    const paymentUrl = String(payload.paymentUrl || "");
    if (!invoiceId || !paymentUrl) {
      return {
        success: false,
        error: "WarungErik tidak mengembalikan paymentUrl",
      };
    }

    return {
      success: true,
      invoiceId,
      paymentUrl,
      qrisString:
        String(payload.dynamicQris || payload.qrisString || "").trim() ||
        undefined,
      qrDataUrl: String(payload.qrCodeDataUrl || "").trim() || undefined,
      finalAmount: Number(
        payload.totalAmount ?? payload.finalAmount ?? input.amount
      ),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    lastError = /Failed to fetch|NetworkError|Load failed/i.test(msg)
      ? "Browser tidak bisa ke WarungErik (CORS/jaringan). Gunakan server route."
      : msg;
    return { success: false, error: lastError };
  }
}