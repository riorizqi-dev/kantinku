import { NextRequest, NextResponse } from "next/server";
// midtrans-client tidak punya types lengkap — gunakan require style import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const midtransClient = require("midtrans-client");

/**
 * POST /api/midtrans
 * Generate Snap Token dari Midtrans.
 *
 * ENV yang dibutuhkan:
 * - MIDTRANS_SERVER_KEY
 * - NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
 * - MIDTRANS_IS_PRODUCTION=true|false (default false = sandbox)
 * - MIDTRANS_API_URL (opsional) override base URL jika memakai endpoint custom
 *
 * Body JSON:
 * {
 *   orderId: string,
 *   amount: number,
 *   customerName: string,
 *   customerPhone?: string,
 *   customerEmail?: string,
 *   items: { id, name, price, quantity }[]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const isProduction =
      process.env.MIDTRANS_IS_PRODUCTION === "true" ||
      process.env.MIDTRANS_IS_PRODUCTION === "1";

    if (!serverKey || !clientKey) {
      return NextResponse.json(
        {
          error:
            "Konfigurasi pembayaran belum lengkap. Hubungi administrator platform.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      orderId,
      amount,
      customerName,
      customerPhone,
      customerEmail,
      items,
    } = body as {
      orderId: string;
      amount: number;
      customerName: string;
      customerPhone?: string;
      customerEmail?: string;
      items?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>;
    };

    if (!orderId || !amount || amount < 1 || !customerName) {
      return NextResponse.json(
        { error: "Data pesanan tidak valid" },
        { status: 400 }
      );
    }

    // Snap client — ganti isProduction ke true di production
    const snap = new midtransClient.Snap({
      isProduction,
      serverKey,
      clientKey,
    });

    // Override API host jika disediakan (untuk setup khusus)
    if (process.env.MIDTRANS_API_URL) {
      // midtrans-client memakai apiConfig; set manual bila perlu
      try {
        if (snap.apiConfig) {
          // Beberapa versi library mengekspos base URL lewat env MIDTRANS_OVERRIDE
          process.env.MIDTRANS_OVERRIDE_API_URL = process.env.MIDTRANS_API_URL;
        }
      } catch {
        // abaikan
      }
    }

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      },
      customer_details: {
        first_name: customerName.slice(0, 50),
        phone: customerPhone || undefined,
        email: customerEmail || undefined,
      },
      item_details: (items || []).map((it) => ({
        id: String(it.id).slice(0, 50),
        name: String(it.name).slice(0, 50),
        price: Math.round(it.price),
        quantity: it.quantity,
      })),
      // Aktifkan metode populer termasuk QRIS di Snap popup
      enabled_payments: [
        "gopay",
        "shopeepay",
        "other_qris",
        "bca_va",
        "bni_va",
        "bri_va",
        "permata_va",
        "other_va",
        "credit_card",
      ],
      callbacks: {
        // Redirect URL opsional (Snap JS callback tetap yang utama di SPA)
        finish: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/orders`
          : undefined,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      clientKey,
      isProduction,
    });
  } catch (err: unknown) {
    console.error("[midtrans]", err);
    const message =
      err && typeof err === "object" && "ApiResponse" in err
        ? JSON.stringify((err as { ApiResponse: unknown }).ApiResponse)
        : err instanceof Error
          ? err.message
          : "Gagal membuat token pembayaran";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
