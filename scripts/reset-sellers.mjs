/**
 * Reset gerai di Supabase:
 * - Nama lapak GERAI RPL/BR/MP/AK/OSIS
 * - Username & password baru
 * - Rating & ulasan = 0
 * - Bersihkan rating di orders
 *
 *   node scripts/reset-sellers.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PEDAGANG = [
  {
    id: "seller_1",
    userId: "user_p1",
    username: "gerai.rpl",
    password: "rpl123",
    name: "Petugas RPL",
    stall: "GERAI RPL",
    booth: "RPL",
  },
  {
    id: "seller_2",
    userId: "user_p2",
    username: "gerai.br",
    password: "br123",
    name: "Petugas BR",
    stall: "GERAI BR",
    booth: "BR",
  },
  {
    id: "seller_3",
    userId: "user_p3",
    username: "gerai.mp",
    password: "mp123",
    name: "Petugas MP",
    stall: "GERAI MP",
    booth: "MP",
  },
  {
    id: "seller_4",
    userId: "user_p4",
    username: "gerai.ak",
    password: "ak123",
    name: "Petugas AK",
    stall: "GERAI AK",
    booth: "AK",
  },
  {
    id: "seller_5",
    userId: "user_p5",
    username: "gerai.osis",
    password: "osis123",
    name: "Petugas OSIS",
    stall: "GERAI OSIS",
    booth: "OSIS",
  },
];

const OBSOLETE = [
  "warungsari",
  "baksojaya",
  "esminum",
  "snackbox",
  "nasiwarung",
  "penjual",
];

async function main() {
  console.log("Reset gerai di Supabase…");

  for (const p of PEDAGANG) {
    const { error: e1 } = await sb
      .from("sellers")
      .update({
        name: p.stall,
        booth: p.booth,
        rating: 0,
        review_count: 0,
        rating_sum: 0,
        is_active: true,
        owner_user_id: p.userId,
      })
      .eq("id", p.id);
    if (e1) throw new Error(`seller ${p.id}: ${e1.message}`);

    const { error: e2 } = await sb
      .from("users")
      .update({
        username: p.username,
        password: p.password,
        name: p.name,
        role: "seller",
        seller_id: p.id,
      })
      .eq("id", p.userId);
    if (e2) throw new Error(`user ${p.userId}: ${e2.message}`);

    console.log(`✓ ${p.stall} → ${p.username} / ${p.password}`);
  }

  // Hapus username demo lama (jika masih ada baris terpisah)
  for (const u of OBSOLETE) {
    const { error } = await sb.from("users").delete().eq("username", u);
    if (error) console.warn("delete", u, error.message);
    else console.log("✓ hapus user lama:", u);
  }

  // Reset rating di semua pesanan
  const { error: e3 } = await sb
    .from("orders")
    .update({
      rating: null,
      rating_comment: null,
      rated_at: null,
    })
    .not("id", "is", null);
  if (e3) console.warn("orders rating reset:", e3.message);
  else console.log("✓ rating pesanan di-reset");

  // Sync seller_name di orders (opsional, tampilan lama)
  for (const p of PEDAGANG) {
    await sb
      .from("orders")
      .update({ seller_name: p.stall })
      .eq("seller_id", p.id);
  }
  console.log("✓ seller_name di orders disesuaikan");

  console.log("\nSelesai. Hard refresh app + clear reviews lokal otomatis di load.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
