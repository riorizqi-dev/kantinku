import { NextResponse } from "next/server";
import { getBayarConfig } from "@/lib/bayar";
import https from "node:https";
import dns from "node:dns";

try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  /* ignore */
}

async function resolveHost(hostname: string, forceIp?: string) {
  if (forceIp) return { ip: forceIp, via: "BAYAR_FORCE_IP" as const };
  try {
    const r = await dns.promises.lookup(hostname, { family: 4 });
    return { ip: r.address, via: "lookup" as const };
  } catch (e1) {
    try {
      const resolver = new dns.promises.Resolver();
      resolver.setServers(["8.8.8.8", "1.1.1.1"]);
      const addrs = await resolver.resolve4(hostname);
      return { ip: addrs[0], via: "resolve4-google" as const };
    } catch (e2) {
      return {
        ip: "95.169.180.225",
        via: "fallback-hardcoded" as const,
        error: e2 instanceof Error ? e2.message : String(e1),
      };
    }
  }
}

function probeIp(
  ip: string,
  hostname: string,
  path: string
): Promise<{
  ok: boolean;
  status?: number;
  ms: number;
  error?: string;
  snippet?: string;
}> {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = https.request(
      {
        host: ip,
        servername: hostname,
        path,
        method: "GET",
        family: 4,
        timeout: 20000,
        headers: {
          Host: hostname,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0",
          Accept: "*/*",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({
            ok: true,
            status: res.statusCode,
            ms: Date.now() - start,
            snippet: text.slice(0, 120).replace(/\s+/g, " "),
          });
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, ms: Date.now() - start, error: "ETIMEDOUT" });
    });
    req.on("error", (err) => {
      resolve({
        ok: false,
        ms: Date.now() - start,
        error: `${(err as NodeJS.ErrnoException).code || ""} ${err.message}`.trim(),
      });
    });
    req.end();
  });
}

/**
 * GET /api/bayar/health
 */
export async function GET() {
  const cfg = getBayarConfig();
  const hasKey = Boolean(cfg.apiKey && cfg.apiKey.length > 6);
  const hostname = "www.bayar.gg";

  const resolved = await resolveHost(hostname, cfg.forceIp || undefined);

  const [home, api] = await Promise.all([
    probeIp(resolved.ip, hostname, "/"),
    probeIp(resolved.ip, hostname, "/api/create-payment.php"),
  ]);

  const bayarStatus =
    !home.ok && !api.ok
      ? "unreachable"
      : /maintenance|pemeliharaan/i.test(home.snippet || "")
        ? "maintenance"
        : home.ok || api.ok
          ? "ok"
          : "error";

  return NextResponse.json({
    configured: hasKey,
    baseUrl: cfg.baseUrl,
    paymentMethod: cfg.paymentMethod,
    forceIp: cfg.forceIp || null,
    resolved,
    probes: { home, api },
    bayarStatus,
    ready: hasKey && bayarStatus === "ok",
    tip:
      bayarStatus === "unreachable"
        ? "Masih unreachable. Tambah di .env.local: BAYAR_FORCE_IP=95.169.180.225 lalu restart npm run dev. Atau ganti DNS Windows ke 8.8.8.8. Sementara pakai Bayar di Kantin."
        : bayarStatus === "maintenance"
          ? "Bayar.gg maintenance."
          : "Koneksi OK. Coba checkout QRIS lagi.",
  });
}
