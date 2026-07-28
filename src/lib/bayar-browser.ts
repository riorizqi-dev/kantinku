/**
 * Create payment Bayar.gg dari BROWSER (bukan Node server).
 *
 * Kenapa ada ini?
 * - Di beberapa PC/Windows, Node timeout ke Bayar.gg (ETIMEDOUT),
 *   tapi browser tetap bisa akses internet ke domain yang sama.
 * - API key harus di NEXT_PUBLIC_BAYAR_API_KEY (terekspos di browser).
 *   Hanya untuk dev/lokal. Production ideal: server Vercel + BAYAR_API_KEY rahasia.
 */

export type BrowserCreateResult =
  | {
      success: true;
      invoiceId: string;
      paymentUrl: string;
      qrisString?: string;
      finalAmount?: number;
    }
  | { success: false; error: string };

function getBrowserConfig() {
  const apiKey = (
    process.env.NEXT_PUBLIC_BAYAR_API_KEY ||
    process.env.NEXT_PUBLIC_BAYAR_KEY ||
    ""
  ).trim();

  let baseUrl = (
    process.env.NEXT_PUBLIC_BAYAR_BASE_URL ||
    process.env.NEXT_PUBLIC_BAYAR_API_URL ||
    "https://www.bayar.gg/api"
  )
    .trim()
    .replace(/\/$/, "");

  if (baseUrl === "https://www.bayar.gg" || baseUrl === "https://bayar.gg") {
    baseUrl = `${baseUrl}/api`;
  }

  const paymentMethod =
    process.env.NEXT_PUBLIC_BAYAR_PAYMENT_METHOD || "qris";
  const useQrisConverter =
    process.env.NEXT_PUBLIC_BAYAR_USE_QRIS_CONVERTER !== "false";
  const paymentUrl = (
    process.env.NEXT_PUBLIC_BAYAR_PAYMENT_URL ||
    process.env.BAYAR_PAYMENT_URL ||
    "https://www.bayar.gg/pay"
  )
    .trim()
    .replace(/\/$/, "")
    .replace(/\?invoice=.*$/i, "");

  return { apiKey, baseUrl, paymentMethod, useQrisConverter, paymentUrl };
}

export async function createBayarPaymentInBrowser(input: {
  amount: number;
  description: string;
  customerName: string;
  customerPhone?: string;
  redirectUrl: string;
}): Promise<BrowserCreateResult> {
  const cfg = getBrowserConfig();

  if (!cfg.apiKey) {
    return {
      success: false,
      error:
        "Tambahkan NEXT_PUBLIC_BAYAR_API_KEY di .env.local (sama dengan BAYAR_API_KEY), lalu restart npm run dev. Ini dibutuhkan karena server PC kamu tidak bisa connect ke Bayar.gg.",
    };
  }

  const jsonBody = {
    amount: Math.round(input.amount),
    description: input.description.slice(0, 120),
    customer_name: input.customerName.slice(0, 80),
    customer_phone: input.customerPhone || undefined,
    redirect_url: input.redirectUrl,
    payment_url: cfg.paymentUrl,
    payment_method: cfg.paymentMethod,
    use_qris_converter: cfg.useQrisConverter,
  };

  const formBody = new URLSearchParams(
    Object.entries({
      amount: String(Math.round(input.amount)),
      description: input.description.slice(0, 120),
      customer_name: input.customerName.slice(0, 80),
      customer_phone: input.customerPhone || "",
      redirect_url: input.redirectUrl,
      payment_url: cfg.paymentUrl,
      payment_method: cfg.paymentMethod,
      use_qris_converter: cfg.useQrisConverter ? "true" : "false",
      api_key: cfg.apiKey,
    }).filter(([, value]) => value !== "")
  );

  const urls = Array.from(
    new Set([
      `${cfg.baseUrl}/create-payment.php`,
      "https://www.bayar.gg/api/create-payment.php",
      "https://bayar.gg/api/create-payment.php",
    ])
  );

  let lastError = "Gagal menghubungi Bayar.gg dari browser";

  async function tryCreate(
    url: string,
    body: BodyInit,
    headers: Record<string, string>
  ): Promise<BrowserCreateResult> {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      mode: "cors",
      cache: "no-store",
    });

    const text = await res.text();

    if (/maintenance|pemeliharaan/i.test(text) && text.includes("<")) {
      return { success: false, error: "Bayar.gg sedang maintenance" };
    }

    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {
        success: false,
        error:
          res.type === "opaque"
            ? "Browser diblok CORS oleh Bayar.gg"
            : `Respons bukan JSON (HTTP ${res.status})`,
      };
    }

    if (!res.ok || data.success === false) {
      return {
        success: false,
        error:
          (typeof data.error === "string" && data.error) ||
          (typeof data.message === "string" && data.message) ||
          `HTTP ${res.status}`,
      };
    }

    const nested = (data.data || data.payment || {}) as Record<
      string,
      unknown
    >;
    const invoiceId = String(
      nested.invoice_id ||
        data.invoice_id ||
        data.transaction_id ||
        ""
    );
    const paymentUrl = String(
      nested.payment_url ||
        data.payment_url ||
        (invoiceId
          ? `${cfg.paymentUrl}?invoice=${encodeURIComponent(invoiceId)}`
          : "")
    );

    if (!paymentUrl) {
      return {
        success: false,
        error: "Bayar.gg tidak mengembalikan payment_url",
      };
    }

    const qrisString = String(
      nested.qris_string || nested.qrisString || data.qris_string || ""
    ).trim();

    return {
      success: true,
      invoiceId,
      paymentUrl,
      qrisString: qrisString || undefined,
      finalAmount: Number(
        nested.final_amount ?? nested.amount ?? input.amount
      ),
    };
  }

  for (const url of urls) {
    try {
      const result = await tryCreate(url, JSON.stringify(jsonBody), {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": cfg.apiKey,
      });

      if (result.success) return result;
      lastError = result.error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError =
        /Failed to fetch|NetworkError|Load failed/i.test(msg)
          ? "Browser juga tidak bisa ke Bayar.gg (CORS/jaringan). Coba hotspot HP atau tanya support Bayar.gg aktifkan CORS / cek API."
          : msg;
    }
  }

  // Fallback without X-API-Key header to reduce CORS/preflight issues.
  // Some Bayar.gg setups may allow browser POSTs when API key is sent as form data
  // instead of a custom request header.
  for (const url of urls) {
    try {
      const result = await tryCreate(url, formBody.toString(), {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      });

      if (result.success) return result;
      lastError = result.error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError =
        /Failed to fetch|NetworkError|Load failed/i.test(msg)
          ? "Browser juga tidak bisa ke Bayar.gg (CORS/jaringan). Coba hotspot HP atau tanya support Bayar.gg aktifkan CORS / cek API."
          : msg;
    }
  }

  return { success: false, error: lastError };
}
