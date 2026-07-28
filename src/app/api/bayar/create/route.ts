import { NextRequest, NextResponse } from "next/server";
import { createBayarPayment } from "@/lib/bayar";

/**
 * POST /api/bayar/create
 *
 * Membuat invoice di Bayar.gg.
 * Auth: BAYAR_API_KEY (header X-API-Key ke Bayar.gg)
 * Base: BAYAR_BASE_URL (default https://www.bayar.gg/api)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      amount,
      customerName,
      customerPhone,
      description,
    } = body as {
      orderId: string;
      amount: number;
      customerName: string;
      customerPhone?: string;
      description?: string;
    };

    if (!orderId || !amount || amount < 1000 || !customerName) {
      return NextResponse.json(
        { error: "Data pembayaran tidak valid (min. Rp 1.000)" },
        { status: 400 }
      );
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    const result = await createBayarPayment({
      amount: Math.round(amount),
      description: (
        description || `KantinKu ${orderId} — ${customerName}`
      ).slice(0, 120),
      customerName: customerName.slice(0, 80),
      customerPhone: customerPhone || undefined,
      callbackUrl: `${appUrl}/api/bayar/webhook`,
      redirectUrl: `${appUrl}/orders?paid=1&order=${encodeURIComponent(orderId)}`,
    });

    if (!result.success || !result.paymentUrl) {
      return NextResponse.json(
        { error: result.error || "Gagal membuat pembayaran Bayar.gg" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      invoiceId: result.invoiceId,
      paymentUrl: result.paymentUrl,
      qrisString: result.qrisString || null,
      amount: result.amount,
      finalAmount: result.finalAmount,
      status: result.status,
      expiresAt: result.expiresAt,
    });
  } catch (err) {
    console.error("[bayar/create]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Gagal menghubungi Bayar.gg",
      },
      { status: 500 }
    );
  }
}
