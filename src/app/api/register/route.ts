import { NextResponse } from "next/server";
import { getSupabaseBrowser } from "@/lib/supabase/repo";
import { userToDb } from "@/lib/supabase/mappers";
import { hashPassword } from "@/lib/password";
import { nisError } from "@/lib/nis";
import { uid } from "@/lib/utils";
import { clientIp, rateLimit, rateLimitHeader } from "@/lib/rateLimit";

type Body = {
  name?: string;
  kelas?: string;
  username?: string;
  password?: string;
  phone?: string;
  nis?: string;
};

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: extraHeaders });
}

/**
 * POST /api/register
 * body: { name, kelas, username, password, phone?, nis }
 *
 * Validasi otoritatif di sisi server — tidak bisa di-bypass lewat request
 * langsung karena inilah satu-satunya pintu tulis akun siswa:
 *  - Rate limit 5 percobaan / menit / IP (anti bot/spam akun)
 *  - Validasi format NIS (6–10 digit angka)
 *  - Cek UNIK username & NIS terhadap database (constraint unique sebagai
 *    pengaman final — pelanggaran => error 23505 => 409 "NIS ini sudah terdaftar")
 *  - Password di-hash (PBKDF2) server-side; plain text tidak pernah disimpan
 *
 * Respons: 200 { ok, user: { id } } | 4xx { ok:false, code, error } | 503 not_configured
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`register:${ip}`, { max: 5, windowMs: 60_000 });
  const rlHeaders = rateLimitHeader(rl);
  if (!rl.allowed) {
    return json(
      {
        ok: false,
        code: "rate_limited",
        error: "Terlalu banyak percobaan daftar. Coba lagi beberapa menit lagi.",
      },
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

  const name = String(body.name || "").trim();
  const kelas = String(body.kelas || "").trim();
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const phone = String(body.phone || "").trim();
  const nis = String(body.nis || "").trim();

  // ---- validasi format ----
  if (name.length < 2) return json({ ok: false, code: "invalid", error: "Nama minimal 2 karakter" }, 400, rlHeaders);
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return json({ ok: false, code: "invalid", error: "Username: 3-24 karakter (huruf, angka, underscore)" }, 400, rlHeaders);
  }
  if (password.length < 6) return json({ ok: false, code: "invalid", error: "Password minimal 6 karakter" }, 400, rlHeaders);
  if (password.length > 128) return json({ ok: false, code: "invalid", error: "Password terlalu panjang" }, 400, rlHeaders);
  if (!kelas) return json({ ok: false, code: "invalid", error: "Kelas wajib diisi" }, 400, rlHeaders);
  const nisErr = nisError(nis);
  if (nisErr) return json({ ok: false, code: "invalid", error: nisErr }, 400, rlHeaders);

  const sb = getSupabaseBrowser();
  if (!sb) {
    return json({ ok: false, code: "not_configured" }, 503, rlHeaders);
  }

  try {
    // ---- cek unik username (case-insensitive) ----
    const { data: userRow } = await sb
      .from("users")
      .select("id")
      .ilike("username", username)
      .limit(1);
    if ((userRow || []).length) {
      return json({ ok: false, code: "username_taken", error: "Username sudah digunakan" }, 409, rlHeaders);
    }

    // ---- cek unik NIS (jantung anti-spam) ----
    const { data: nisRow } = await sb
      .from("users")
      .select("id")
      .eq("nis", nis)
      .limit(1);
    if ((nisRow || []).length) {
      return json({ ok: false, code: "nis_taken", error: "NIS ini sudah terdaftar" }, 409, rlHeaders);
    }

    // ---- insert (password di-hash) ----
    const id = uid("user");
    const { error: insertErr } = await sb.from("users").insert(
      userToDb({
        id,
        username,
        password: await hashPassword(password),
        name,
        role: "buyer",
        kelas,
        phone,
        nis,
        createdAt: Date.now(),
      })
    );

    // 23505 = unique_violation (race condition dua request NIS sama).
    // Supabase mengembalikan code "23505" pada error PostgrestRESTError.
    const code = (insertErr as { code?: string } | null)?.code;
    if (insertErr && (code === "23505" || (insertErr.message || "").includes("users_nis_uidx"))) {
      return json({ ok: false, code: "nis_taken", error: "NIS ini sudah terdaftar" }, 409, rlHeaders);
    }
    if (insertErr) {
      console.error("[register]", insertErr.message);
      return json({ ok: false, code: "server_error", error: "Gagal menyimpan akun" }, 500, rlHeaders);
    }

    return json({ ok: true, user: { id } }, 201, rlHeaders);
  } catch (err) {
    console.error("[register]", err);
    return json(
      { ok: false, code: "server_error", error: err instanceof Error ? err.message : "Terjadi kesalahan server" },
      500,
      rlHeaders
    );
  }
}