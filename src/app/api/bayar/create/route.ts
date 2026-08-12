import { NextRequest, NextResponse } from "next/server";
import { createWarungerikPayment } from "@/lib/warungerik";

/**
 * POST /api/bayar/create
 *
 * Membuat invoice QRIS di WarungErik Pay (pg.warungerik.com).
 * Auth: WARUNGERIK_API_KEY (header X-API-KEY ke pg.warungerik.com)
 * Base: WARUNGERIK_BASE_URL (default https://pg.warungerik.com)
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

    const result = await createWarungerikPayment({
      orderId,
      amount: Math.round(amount),
      customerName: customerName.slice(0, 80),
      customerPhone: customerPhone || undefined,
      description,
    });

    if (!result.success || !result.paymentUrl) {
      return NextResponse.json(
        { error: result.error || "Gagal membuat pembayaran QRIS" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      invoiceId: result.invoiceId,
      paymentUrl: result.paymentUrl,
      qrisString: result.qrisString || null,
      qrDataUrl: result.qrDataUrl || null,
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
          err instanceof Error
            ? err.message
            : "Gagal menghubungi WarungErik Pay",
      },
      { status: 500 }
    );
  }
}