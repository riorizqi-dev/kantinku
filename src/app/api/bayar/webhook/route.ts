import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/bayar/webhook
 *
 * Callback opsional dari WarungErik Pay (jika dikonfigurasi di dashboard).
 * Data order KantinKu disimpan di localStorage browser, jadi status order
 * disinkronkan lewat polling /api/bayar/check dari frontend.
 * Endpoint ini hanya mencatat callback & selalu balas 200 agar tidak retry.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      // tetap 200 — non-JSON callback jangan bikin retry loop
      return NextResponse.json({ success: true, received: true });
    }

    console.info("[bayar/webhook]", {
      event: body.event || body.type,
      orderId: body.orderId || body.order_id,
      status: body.status,
      amount: body.amount,
      paidAt: body.paidAt || body.paid_at,
      raw: raw.slice(0, 500),
    });

    return NextResponse.json({ success: true, received: true });
  } catch (err) {
    console.error("[bayar/webhook]", err);
    return NextResponse.json({ success: true, received: true });
  }
}