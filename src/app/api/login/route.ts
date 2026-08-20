import { NextResponse } from "next/server";
import { getSupabaseBrowser } from "@/lib/supabase/repo";
import { verifyPassword } from "@/lib/password";
import { clientIp, rateLimit, rateLimitHeader } from "@/lib/rateLimit";

type Body = { username?: string; password?: string };

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: extraHeaders });
}

/**
 * POST /api/login
 * body: { username, password }
 *
 * Gerbang throttling anti brute-force untuk login:
 *  - Rate limit 10 percobaan / menit / IP => 429 bila melewati.
 *  - Verifikasi kredensial terhadap database (password hash/plain legacy).
 *
 * Catatan: auth utama KantinKu masih lokal (localStorage) — endpoint ini
 * hanya jadi pengaman lapisan jaringan; sesi final tetap dibuat client-side.
 * 401 dipakai untuk info, klien tetap boleh login lokal (fallback demo);
 * HANYA 429 yang memblokir login. Untuk produksi ketat, pindah ke Supabase
 * Auth + JWT (lihat README/review keamanan).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`login:${ip}`, { max: 10, windowMs: 60_000 });
  const rlHeaders = rateLimitHeader(rl);
  if (!rl.allowed) {
    return json(
      { ok: false, code: "rate_limited", error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." },
      429,
      rlHeaders
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ ok: false, code: "bad_request", error: "Body tidak valid" }, 400, rlHeaders);
  }

  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  const sb = getSupabaseBrowser();
  if (!sb) {
    return json({ ok: false, code: "not_configured" }, 503, rlHeaders);
  }

  try {
    const { data: rows } = await sb
      .from("users")
      .select("password, is_active")
      .ilike("username", username)
      .limit(1);
    const user = (rows || [])[0];
    if (!user) return json({ ok: false, code: "invalid" }, 401, rlHeaders);
    if (user.is_active === false) {
      return json({ ok: false, code: "disabled" }, 403, rlHeaders);
    }
    const ok = await verifyPassword(password, user.password || "");
    if (!ok) return json({ ok: false, code: "invalid" }, 401, rlHeaders);

    return json({ ok: true }, 200, rlHeaders);
  } catch (err) {
    console.error("[login]", err);
    return json({ ok: false, code: "server_error" }, 500, rlHeaders);
  }
}