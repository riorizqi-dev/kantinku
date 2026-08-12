import { NextResponse } from "next/server";
import { getWarungerikConfig } from "@/lib/warungerik";

/**
 * GET /api/bayar/health
 * Cek konfigurasi + koneksi ke WarungErik Pay.
 */
export async function GET() {
  const cfg = getWarungerikConfig();
  const hasKey = Boolean(cfg.apiKey && cfg.apiKey.length > 6);
  const hostname = cfg.baseUrl.replace(/^https?:\/\//, "").split("/")[0];

  const probe = async (
    path: string
  ): Promise<{ ok: boolean; status?: number; ms: number; error?: string }> => {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${cfg.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": cfg.apiKey,
        },
        body: JSON.stringify({
          orderId: `HEALTH-${Date.now()}`,
          amount: 1000,
          customerName: "Health Check",
          note: "health",
        }),
        signal: controller.signal,
      });
      clearTimeout(t);
      return { ok: res.status < 500, status: res.status, ms: Date.now() - start };
    } catch (err) {
      return {
        ok: false,
        ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  };

  const api = await probe("/api/checkout");
  // 401 = key salah/tidak ada tapi server merespons. 200 = sukses penuh.
  const gatewayStatus =
    api.status === 401
      ? "reachable_auth_failed"
      : api.ok
        ? "ok"
        : api.error
          ? "unreachable"
          : "error";

  return NextResponse.json({
    configured: hasKey,
    baseUrl: cfg.baseUrl,
    hostname,
    probe: api,
    gatewayStatus,
    ready: hasKey && gatewayStatus === "ok",
    tip:
      gatewayStatus === "ok"
        ? "Koneksi OK. Coba checkout QRIS lagi."
        : gatewayStatus === "reachable_auth_failed"
          ? "Server WarungErik terjangkau, tapi API key ditolak (401). Periksa WARUNGERIK_API_KEY di .env.local."
          : "Belum terjangkau. Periksa koneksi internet / isi WARUNGERIK_API_KEY di .env.local.",
  });
}