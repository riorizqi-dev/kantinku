import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppState, Order, Product, Seller, User } from "@/lib/types";
import {
  orderFromDb,
  orderItemToDb,
  orderToDb,
  productFromDb,
  productToDb,
  sellerFromDb,
  sellerToDb,
  settingsFromDb,
  settingsToDb,
  userFromDb,
  userToDb,
  variantToDb,
  withdrawalFromDb,
  withdrawalToDb,
  salesReportFromDb,
  salesReportToDb,
  type DbOrder,
  type DbOrderItem,
  type DbProduct,
  type DbSeller,
  type DbSettings,
  type DbUser,
  type DbVariant,
  type DbWithdrawal,
  type DbSalesReport,
  type RemoteBundle,
} from "./mappers";
import {
  DEFAULT_PRODUCTS,
  DEFAULT_SELLERS,
  DEFAULT_USERS,
  createInitialState,
} from "@/lib/seed";

function getClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key || key.length < 20) return null;
  return createClient(url, key);
}

export function getSupabaseBrowser(): SupabaseClient | null {
  return getClient();
}

export async function loadRemoteBundle(): Promise<RemoteBundle | null> {
  const sb = getClient();
  if (!sb) return null;

  const [
    sellersRes,
    usersRes,
    productsRes,
    variantsRes,
    settingsRes,
    ordersRes,
    itemsRes,
    withdrawalsRes,
    salesReportsRes,
  ] = await Promise.all([
    sb.from("sellers").select("*"),
    sb.from("users").select("*"),
    sb.from("products").select("*"),
    sb.from("product_variants").select("*"),
    sb.from("platform_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("orders").select("*").order("created_at", { ascending: false }),
    sb.from("order_items").select("*"),
    sb.from("withdrawal_requests").select("*").order("created_at", { ascending: false }),
    sb.from("sales_reports").select("*").order("report_date", { ascending: false }),
  ]);

  if (sellersRes.error) throw new Error(sellersRes.error.message);
  if (usersRes.error) throw new Error(usersRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);
  if (variantsRes.error) throw new Error(variantsRes.error.message);
  if (ordersRes.error) throw new Error(ordersRes.error.message);
  if (itemsRes.error) throw new Error(itemsRes.error.message);

  const sellers = ((sellersRes.data || []) as DbSeller[]).map(sellerFromDb);
  const users = ((usersRes.data || []) as DbUser[]).map(userFromDb);

  const variantsByProduct = new Map<string, DbVariant[]>();
  for (const v of (variantsRes.data || []) as DbVariant[]) {
    const list = variantsByProduct.get(v.product_id) || [];
    list.push(v);
    variantsByProduct.set(v.product_id, list);
  }

  const products = ((productsRes.data || []) as DbProduct[]).map((p) =>
    productFromDb(p, variantsByProduct.get(p.id) || [])
  );

  const itemsByOrder = new Map<string, DbOrderItem[]>();
  for (const it of (itemsRes.data || []) as DbOrderItem[]) {
    const list = itemsByOrder.get(it.order_id) || [];
    list.push(it);
    itemsByOrder.set(it.order_id, list);
  }

  const orders = ((ordersRes.data || []) as DbOrder[]).map((o) =>
    orderFromDb(o, itemsByOrder.get(o.id) || [])
  );

  let settings = createInitialState().settings;
  let orderSeq = 0;
  if (settingsRes.data) {
    const parsed = settingsFromDb(settingsRes.data as DbSettings);
    settings = parsed.settings;
    orderSeq = parsed.orderSeq;
  }

  const withdrawals = ((withdrawalsRes.data || []) as DbWithdrawal[]).map(withdrawalFromDb);
  const salesReports = ((salesReportsRes.data || []) as DbSalesReport[]).map(salesReportFromDb);

  return {
    sellers,
    users,
    products,
    orders,
    settings,
    orderSeq,
    withdrawals,
    salesReports,
  };
}

export async function countCoreRows(): Promise<number> {
  const sb = getClient();
  if (!sb) return 0;
  const { count, error } = await sb
    .from("sellers")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Seed demo data jika sellers kosong */
export async function seedIfEmpty(force = false): Promise<{
  seeded: boolean;
  reason: string;
}> {
  const sb = getClient();
  if (!sb) return { seeded: false, reason: "Supabase belum dikonfigurasi" };

  const n = await countCoreRows();
  if (n > 0 && !force) {
    return { seeded: false, reason: `Sudah ada ${n} seller — skip seed` };
  }

  if (force) {
    // Hapus data (order dulu karena FK)
    await sb.from("order_items").delete().neq("id", 0);
    await sb.from("orders").delete().neq("id", "");
    await sb.from("withdrawal_requests").delete().neq("id", "");
    await sb.from("product_variants").delete().neq("id", "");
    await sb.from("products").delete().neq("id", "");
    await sb.from("users").delete().neq("id", "");
    await sb.from("sellers").delete().neq("id", "");
  }

  const sellers = DEFAULT_SELLERS.map(sellerToDb);
  const { error: e1 } = await sb.from("sellers").upsert(sellers);
  if (e1) throw new Error(`sellers: ${e1.message}`);

  const users = DEFAULT_USERS.map(userToDb);
  const { error: e2 } = await sb.from("users").upsert(users);
  if (e2) throw new Error(`users: ${e2.message}`);

  const products = DEFAULT_PRODUCTS.map(productToDb);
  const { error: e3 } = await sb.from("products").upsert(products);
  if (e3) throw new Error(`products: ${e3.message}`);

  const variants = DEFAULT_PRODUCTS.flatMap((p) =>
    (p.variants || []).map((v) => variantToDb(v, p.id))
  );
  const { error: e4 } = await sb.from("product_variants").upsert(variants);
  if (e4) throw new Error(`variants: ${e4.message}`);

  const initial = createInitialState();
  const { error: e5 } = await sb
    .from("platform_settings")
    .upsert(settingsToDb(initial.settings, 0));
  if (e5) throw new Error(`settings: ${e5.message}`);

  return { seeded: true, reason: "Seed demo berhasil dimasukkan ke Supabase" };
}

/** Sync entity state ke Supabase (upsert). Cart/session tidak ikut. */
export async function syncBundleToSupabase(
  state: Pick<
    AppState,
    | "sellers"
    | "users"
    | "products"
    | "orders"
    | "settings"
    | "orderSeq"
    | "withdrawals"
    | "salesReports"
  >
): Promise<void> {
  const sb = getClient();
  if (!sb) return;

  // Tiap blok berjalan independen: kegagalan satu bagian (mis. kolom belum
  // dimigrasi) tidak membatalkan sync bagian lain.
  try {
    const rows = state.sellers.map(sellerToDb);
    if (rows.length) {
      const { error } = await sb.from("sellers").upsert(rows);
      if (error) throw error;
    }
  } catch (e) {
    console.warn("[supabase sync sellers]", e);
  }

  try {
    const rows = state.users.map(userToDb);
    if (rows.length) {
      const { error } = await sb.from("users").upsert(rows);
      if (error) throw error;
    }
  } catch (e) {
    console.warn("[supabase sync users]", e);
  }

  try {
    const prows = state.products.map(productToDb);
    if (prows.length) {
      const { error } = await sb.from("products").upsert(prows);
      if (error) throw error;
    }

    const keepProductIds = new Set(state.products.map((p) => p.id));
    const { data: remoteProducts } = await sb.from("products").select("id");
    const deadProducts = ((remoteProducts || []) as { id: string }[])
      .map((r) => r.id)
      .filter((id) => !keepProductIds.has(id));
    if (deadProducts.length) {
      await sb.from("product_variants").delete().in("product_id", deadProducts);
      await sb.from("products").delete().in("id", deadProducts);
    }

    const vrows = state.products.flatMap((p) =>
      (p.variants || []).map((v) => variantToDb(v, p.id))
    );
    if (vrows.length) {
      const { error } = await sb.from("product_variants").upsert(vrows);
      if (error) throw error;
    }

    const keepIds = new Set(vrows.map((v) => v.id));
    const productIds = state.products.map((p) => p.id);
    if (productIds.length) {
      const { data: existing } = await sb
        .from("product_variants")
        .select("id")
        .in("product_id", productIds);
      const toDelete = ((existing || []) as { id: string }[])
        .map((r) => r.id)
        .filter((id) => !keepIds.has(id));
      if (toDelete.length) {
        await sb.from("product_variants").delete().in("id", toDelete);
      }
    }
  } catch (e) {
    console.warn("[supabase sync products]", e);
  }

  try {
    const { error } = await sb
      .from("platform_settings")
      .upsert(settingsToDb(state.settings, state.orderSeq));
    if (error) throw error;
  } catch (e) {
    console.warn("[supabase sync settings]", e);
  }

  try {
    for (const o of state.orders) {
      await upsertOrder(sb, o);
    }
  } catch (e) {
    console.warn("[supabase sync orders]", e);
  }

  try {
    const rows = state.withdrawals.map(withdrawalToDb);
    if (rows.length) {
      const { error } = await sb.from("withdrawal_requests").upsert(rows);
      if (error) throw error;
    }
  } catch (e) {
    console.warn("[supabase sync withdrawals]", e);
  }

  try {
    const rows = (state.salesReports || []).map(salesReportToDb);
    if (rows.length) {
      const { error } = await sb.from("sales_reports").upsert(rows);
      if (error) throw error;
    }
  } catch (e) {
    console.warn("[supabase sync sales_reports]", e);
  }
}

async function upsertOrder(sb: SupabaseClient, o: Order) {
  const { error: e1 } = await sb.from("orders").upsert(orderToDb(o));
  if (e1) throw new Error(`sync order ${o.id}: ${e1.message}`);

  // replace items
  await sb.from("order_items").delete().eq("order_id", o.id);
  const items = o.items.map((it) => orderItemToDb(it, o.id));
  if (items.length) {
    const { error: e2 } = await sb.from("order_items").insert(items);
    if (e2) throw new Error(`sync order_items ${o.id}: ${e2.message}`);
  }
}

export async function deleteProductRemote(productId: string) {
  const sb = getClient();
  if (!sb) return;
  await sb.from("product_variants").delete().eq("product_id", productId);
  await sb.from("products").delete().eq("id", productId);
}

export async function upsertProductRemote(product: Product) {
  const sb = getClient();
  if (!sb) return;
  const { error: e1 } = await sb.from("products").upsert(productToDb(product));
  if (e1) throw new Error(e1.message);
  const variants = (product.variants || []).map((v) =>
    variantToDb(v, product.id)
  );
  if (variants.length) {
    const { error: e2 } = await sb.from("product_variants").upsert(variants);
    if (e2) throw new Error(e2.message);
  }
  // prune removed variants
  const keep = new Set(variants.map((v) => v.id));
  const { data: existing } = await sb
    .from("product_variants")
    .select("id")
    .eq("product_id", product.id);
  const del = ((existing || []) as { id: string }[])
    .map((r) => r.id)
    .filter((id) => !keep.has(id));
  if (del.length) await sb.from("product_variants").delete().in("id", del);
}

export async function upsertSellerRemote(seller: Seller) {
  const sb = getClient();
  if (!sb) return;
  const { error } = await sb.from("sellers").upsert(sellerToDb(seller));
  if (error) throw new Error(error.message);
}

export async function upsertUserRemote(user: User) {
  const sb = getClient();
  if (!sb) return;
  const { error } = await sb.from("users").upsert(userToDb(user));
  if (error) throw new Error(error.message);
}

export async function upsertOrderRemote(order: Order) {
  const sb = getClient();
  if (!sb) return;
  await upsertOrder(sb, order);
}
