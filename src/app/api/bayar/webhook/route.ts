import { NextRequest, NextResponse } from "next/server";
import { getBayarConfig, verifyBayarWebhookSignature } from "@/lib/bayar";

/**
 * POST /api/bayar/webhook
 * Callback dari Bayar.gg saat payment.paid
 *
 * Catatan: data order KantinKu disimpan di localStorage browser,
 * jadi webhook di sini memverifikasi signature & mencatat status.
 * Update UI order dilakukan saat user kembali + polling /api/bayar/check.
 *
 * Set di Bayar.gg dashboard:
 * - Default Callback URL = https://your-domain.com/api/bayar/webhook
 * - Webhook Secret → BAYAR_WEBHOOK_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const cfg = getBayarConfig();
    const invoiceId = String(body.invoice_id || "");
    const status = String(body.status || "").toLowerCase();
    const finalAmount = body.final_amount ?? body.paid_amount ?? body.amount ?? "";
    const timestamp =
      body.timestamp ??
      req.headers.get("x-webhook-timestamp") ??
      "";
    const signature =
      String(body.signature || "") ||
      req.headers.get("x-webhook-signature") ||
      "";

    if (cfg.webhookSecret && signature) {
      const ok = await verifyBayarWebhookSignature({
        invoiceId,
        status,
        finalAmount: String(finalAmount),
        timestamp: String(timestamp),
        signature,
        secret: cfg.webhookSecret,
      });
      if (!ok) {
        console.warn("[bayar/webhook] invalid signature", invoiceId);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    console.info("[bayar/webhook]", {
      event: body.event,
      invoiceId,
      status,
      amount: body.amount,
      finalAmount,
      paidAt: body.paid_at,
      description: body.description,
    });

    // Selalu balas 200 agar Bayar.gg tidak retry berulang
    return NextResponse.json({ success: true, received: true });
  } catch (err) {
    console.error("[bayar/webhook]", err);
    return NextResponse.json({ success: true, received: true });
  }
}
