import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/supabase/health
 * Cek koneksi Supabase + apakah tabel inti sudah ada.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error:
          "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set",
      },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key);

  // Auth ping (tidak butuh tabel)
  const { error: authError } = await supabase.auth.getSession();

  // Cek tabel inti
  const tables = [
    "sellers",
    "users",
    "products",
    "product_variants",
    "orders",
    "order_items",
    "platform_settings",
  ] as const;

  const tableStatus: Record<string, "ok" | "missing" | "error"> = {};
  for (const t of tables) {
    const { error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (!error) tableStatus[t] = "ok";
    else if (
      error.code === "PGRST205" ||
      /could not find the table/i.test(error.message)
    ) {
      tableStatus[t] = "missing";
    } else {
      tableStatus[t] = "error";
    }
  }

  const allOk = Object.values(tableStatus).every((s) => s === "ok");
  const anyMissing = Object.values(tableStatus).some((s) => s === "missing");

  return NextResponse.json({
    ok: allOk && !authError,
    configured: true,
    url,
    auth: authError ? authError.message : "ok",
    tables: tableStatus,
    tip: allOk
      ? "Supabase siap. Bisa lanjut migrasi data dari localStorage."
      : anyMissing
        ? "Tabel belum ada. Buka Supabase → SQL Editor → jalankan file supabase/schema.sql"
        : "Ada error. Cek anon key / RLS / project status di dashboard.",
  });
}
