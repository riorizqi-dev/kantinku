import { NextRequest, NextResponse } from "next/server";
import { seedIfEmpty } from "@/lib/supabase/repo";

/**
 * POST /api/supabase/seed
 * body: { force?: boolean }
 * Seed data demo ke Supabase (skip jika sudah ada data, kecuali force).
 */
export async function POST(req: NextRequest) {
  try {
    let force = false;
    try {
      const body = await req.json();
      force = Boolean(body?.force);
    } catch {
      /* empty body ok */
    }

    const result = await seedIfEmpty(force);
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error("[supabase/seed]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Seed gagal",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Convenience: GET juga seed (non-force)
  try {
    const result = await seedIfEmpty(false);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Seed gagal",
      },
      { status: 500 }
    );
  }
}
