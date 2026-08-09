import { NextResponse } from "next/server";
import type {
  CheckoutPaymentMethod,
  CheckoutPickupMethod,
  Order,
  OrderItem,
} from "@/lib/types";
import { orderItemToDb, orderToDb, settingsFromDb, settingsToDb } from "@/lib/supabase/mappers";
import { getSupabaseBrowser } from "@/lib/supabase/repo";
import { calcCommission, uid } from "@/lib/utils";
import { formatVariantLabel } from "@/lib/product";
import { clientIp, rateLimit, rateLimitHeader } from "@/lib/rateLimit";

const PAYMENT_METHODS: CheckoutPaymentMethod[] = ["canteen", "online"];
const PICKUP_METHODS: CheckoutPickupMethod[] = ["takeaway", "dinein", "delivery"];

type Body = {
  sellerId?: string;
  buyerId?: string | null;
  buyerAvatar?: string | null;
  buyerName?: string;
  buyerClass?: string;
  buyerPhone?: string;
  notes?: string;
  paymentMethod?: string;
  pickupMethod?: string;
  items?: { productId?: string; variantId?: string; qty?: number }[];
};

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: extraHeaders });
}

/**
 * POST /api/orders
 * body: { sellerId, buyerId?, buyerAvatar?, buyerName, buyerClass, buyerPhone,
 *         notes?, paymentMethod, pickupMethod, items: [{productId, variantId, qty}] }
 *
 * Validasi ulang otoritatif (gerai tutup / stok / can_deliver / harga dari DB),
 * lalu tulis order + order_items + naikkan order_seq. Stok produk TIDAK
 * dipotong di sini — klien yang mengurangi stok lokal (konsisten dengan model
 * sync), server hanya memvalidasi dan mencatat pesanan.
 *
 * Respons sukses: { ok, order (bentuk camelCase Order), orderSeq }
 * Bila Supabase belum dikonfigurasi: 503 { code: "not_configured" }
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`orders:${ip}`, { max: 20, windowMs: 60_000 });
  const rlHeaders = rateLimitHeader(rl);
  if (!rl.allowed) {
    return json(
      { ok: false, code: "rate_limited", error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." },
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

  const sellerId = String(body.sellerId || "").trim();
  const buyerName = String(body.buyerName || "").trim();
  const buyerClass = String(body.buyerClass || "").trim();
  const buyerPhone = String(body.buyerPhone || "").trim();
  const notes = String(body.notes || "").trim();
  const paymentMethod = String(body.paymentMethod || "online") as CheckoutPaymentMethod;
  const pickupMethod = String(body.pickupMethod || "takeaway") as CheckoutPickupMethod;
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!sellerId) return json({ ok: false, code: "invalid", error: "sellerId wajib diisi" }, 400, rlHeaders);
  if (!buyerName) return json({ ok: false, code: "invalid", error: "Nama pembeli wajib diisi" }, 400, rlHeaders);
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return json({ ok: false, code: "invalid", error: "Metode pembayaran tidak dikenali" }, 400, rlHeaders);
  }
  if (!PICKUP_METHODS.includes(pickupMethod)) {
    return json({ ok: false, code: "invalid", error: "Metode penyajian tidak dikenali" }, 400, rlHeaders);
  }
  if (!rawItems.length) {
    return json({ ok: false, code: "invalid", error: "Keranjang kosong" }, 400, rlHeaders);
  }

  const items = rawItems.map((it) => ({
    productId: String(it.productId || "").trim(),
    variantId: String(it.variantId || "").trim(),
    qty: Math.max(1, Math.floor(Number(it.qty) || 0)),
  }));

  const sb = getSupabaseBrowser();
  if (!sb) {
    return json({ ok: false, code: "not_configured" }, 503, rlHeaders);
  }

  try {
    // Seller + pemilik lapak (untuk snapshot avatar)
    const { data: sellerRows, error: errSeller } = await sb
      .from("sellers")
      .select("*")
      .eq("id", sellerId)
      .limit(1);
    if (errSeller) throw new Error(`sellers: ${errSeller.message}`);
    const seller = (sellerRows || [])[0];
    if (!seller) return json({ ok: false, code: "invalid", error: "Kantin tidak ditemukan" }, 404, rlHeaders);
    if (seller.is_open === false) {
      return json({ ok: false, code: "closed", error: "Kantin sedang tutup. Pesanan tidak dapat dibuat." }, 403, rlHeaders);
    }

    let sellerAvatar: string | null = null;
    if (seller.owner_user_id) {
      const { data: ownerRows } = await sb
        .from("users")
        .select("avatar")
        .eq("id", seller.owner_user_id)
        .limit(1);
      sellerAvatar = (ownerRows || [])[0]?.avatar || null;
    }

    // Produk + varian (harus milik seller ini)
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const { data: productRows, error: errProducts } = await sb
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("seller_id", sellerId);
    if (errProducts) throw new Error(`products: ${errProducts.message}`);
    const products = (productRows || []) as {
      id: string;
      name: string;
      image: string;
      can_deliver: boolean;
      is_active: boolean;
    }[];

    const { data: variantRows, error: errVariants } = await sb
      .from("product_variants")
      .select("*")
      .in("product_id", productIds);
    if (errVariants) throw new Error(`variants: ${errVariants.message}`);
    const variants = (variantRows || []) as {
      id: string;
      product_id: string;
      name: string;
      price: number;
      stock: number;
      image: string | null;
      is_active: boolean;
    }[];

    // Validasi tiap line
    const orderItems: OrderItem[] = [];
    let subtotal = 0;
    let allCanDeliver = true;

    for (const it of items) {
      const product = products.find((p) => p.id === it.productId);
      if (!product) {
        return json({ ok: false, code: "invalid", error: "Produk tidak ditemukan" }, 400, rlHeaders);
      }
      if (product.is_active === false) {
        return json({ ok: false, code: "invalid", error: `${product.name} sedang tidak aktif` }, 400, rlHeaders);
      }
      if (product.can_deliver !== true) allCanDeliver = false;

      const variant = variants.find((v) => v.id === it.variantId && v.product_id === it.productId);
      if (!variant) {
        return json({ ok: false, code: "invalid", error: `Varian ${product.name} tidak ditemukan` }, 400, rlHeaders);
      }
      if (variant.is_active === false) {
        return json({ ok: false, code: "invalid", error: `Varian ${variant.name} sedang tidak aktif` }, 400, rlHeaders);
      }
      if (variant.stock < it.qty) {
        return json({ ok: false, code: "stock", error: `Stok ${variant.name} tidak cukup` }, 409, rlHeaders);
      }

      subtotal += variant.price * it.qty;
      orderItems.push({
        productId: product.id,
        variantId: variant.id,
        name: formatVariantLabel(product.name, variant.name),
        productName: product.name,
        variantName: variant.name,
        price: variant.price,
        qty: it.qty,
        image: variant.image || product.image || "",
      });
    }

    if (pickupMethod === "delivery" && !allCanDeliver) {
      return json(
        { ok: false, code: "delivery", error: "Ada produk yang tidak bisa diantar ke kelas" },
        422,
        rlHeaders
      );
    }

    const deliveryFee = pickupMethod === "delivery" ? Number(seller.delivery_fee) || 0 : 0;

    // Settings: komisi + order_seq
    const { data: settingsRow } = await sb
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    const parsed = settingsFromDb(settingsRow as never);
    const commissionRate = parsed.settings.commissionRate;
    const seq = parsed.orderSeq + 1;

    const { commissionAmount, sellerAmount, total } = calcCommission(subtotal, commissionRate);
    const grandTotal = total + deliveryFee;
    const isCanteen = paymentMethod === "canteen";

    const now = Date.now();
    const d = new Date(now);
    const orderNumber = `KK-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(seq).padStart(4, "0")}`;

    const order: Order = {
      id: uid("ord"),
      orderNumber,
      sellerId: seller.id,
      sellerName: seller.name || "Kantin",
      sellerAvatar: sellerAvatar || undefined,
      buyerId: body.buyerId || null,
      buyerName,
      buyerClass,
      buyerPhone,
      buyerAvatar: body.buyerAvatar || undefined,
      items: orderItems,
      subtotal,
      commissionRate,
      commissionAmount,
      sellerAmount: sellerAmount + deliveryFee,
      total: grandTotal,
      deliveryFee,
      pickupMethod,
      notes,
      status: "waiting",
      paymentStatus: isCanteen ? "unpaid" : "pending",
      paymentMethod,
      createdAt: now,
      updatedAt: now,
      seenBySeller: false,
    };

    // Tulis order + items
    const { error: errOrder } = await sb.from("orders").insert(orderToDb(order));
    if (errOrder) throw new Error(`orders: ${errOrder.message}`);

    const dbItems = orderItems.map((it) => orderItemToDb(it, order.id));
    if (dbItems.length) {
      const { error: errItems } = await sb.from("order_items").insert(dbItems);
      if (errItems) throw new Error(`order_items: ${errItems.message}`);
    }

    // Naikkan order_seq
    const { error: errSettings } = await sb
      .from("platform_settings")
      .upsert(settingsToDb(parsed.settings, seq));
    if (errSettings) throw new Error(`settings: ${errSettings.message}`);

    return json({ ok: true, order, orderSeq: seq }, 201, rlHeaders);
  } catch (err) {
    console.error("[orders]", err);
    return json(
      {
        ok: false,
        code: "server_error",
        error: err instanceof Error ? err.message : "Terjadi kesalahan server",
      },
      500,
      rlHeaders
    );
  }
}
