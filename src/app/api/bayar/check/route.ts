import { NextRequest, NextResponse } from "next/server";
import { checkWarungerikPayment } from "@/lib/warungerik";

/**
 * GET /api/bayar/check?invoice=INV-xxx
 * Cek status pembayaran di WarungErik Pay (untuk polling dari frontend)
 */
export async function GET(req: NextRequest) {
  const invoice = req.nextUrl.searchParams.get("invoice");
  if (!invoice) {
    return NextResponse.json(
      { error: "Parameter invoice wajib" },
      { status: 400 }
    );
  }

  try {
    const result = await checkWarungerikPayment(invoice);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Gagal cek status" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      invoiceId: result.invoiceId,
      status: result.status,
      amount: result.amount,
      finalAmount: result.finalAmount,
      paidAt: result.paidAt,
      paidReff: result.paidReff,
    });
  } catch (err) {
    console.error("[bayar/check]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}