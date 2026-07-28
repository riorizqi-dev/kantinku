/**
 * Seed demo KantinKu → Supabase
 *   node scripts/seed-supabase.mjs
 *   node scripts/seed-supabase.mjs --force
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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const force = process.argv.includes("--force");

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key);

const img = (seed, w = 900, h = 900) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

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

const now = new Date().toISOString();

const sellers = PEDAGANG.map((p) => ({
  id: p.id,
  name: p.stall,
  owner_user_id: p.userId,
  phone: "",
  booth: p.booth,
  is_active: true,
  rating: 0,
  review_count: 0,
  rating_sum: 0,
  created_at: now,
}));

const users = [
  {
    id: "user_super",
    username: "superadmin",
    password: "super123",
    name: "Super Admin",
    role: "superadmin",
    phone: "",
    seller_id: null,
    avatar: null,
    kelas: null,
    created_at: now,
  },
  {
    id: "user_admin",
    username: "admin",
    password: "admin123",
    name: "Admin Platform",
    role: "admin",
    phone: "",
    seller_id: null,
    avatar: null,
    kelas: null,
    created_at: now,
  },
  ...PEDAGANG.map((p) => ({
    id: p.userId,
    username: p.username,
    password: p.password,
    name: p.name,
    role: "seller",
    phone: "",
    seller_id: p.id,
    avatar: null,
    kelas: null,
    created_at: now,
  })),
];

/** Compact multi-variant catalog (subset + full from app seed) */
const products = [
  {
    id: "prod_s1_mie",
    seller_id: "seller_1",
    name: "Mie",
    category: "Makanan",
    description: "Aneka mie goreng & kuah.",
    image: img("photo-1569718212165-3a8278d5f624"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_mie_goreng_rendang",
        name: "Mie Goreng Rendang",
        price: 14000,
        stock: 12,
        image: img("photo-1612929633738-8fe44f7ec841"),
      },
      {
        id: "var_mie_goreng_geprek",
        name: "Mie Goreng Ayam Geprek",
        price: 15000,
        stock: 10,
        image: img("photo-1585032226651-759b368d7246"),
      },
      {
        id: "var_mie_kuah_soto",
        name: "Mie Kuah Soto",
        price: 13000,
        stock: 15,
        image: img("photo-1569718212165-3a8278d5f624"),
      },
      {
        id: "var_mie_kuah_ayam",
        name: "Mie Kuah Ayam",
        price: 13000,
        stock: 14,
        image: img("photo-1555126634-323283e090fa"),
      },
    ],
  },
  {
    id: "prod_s1_teh",
    seller_id: "seller_1",
    name: "Teh",
    category: "Minuman",
    description: "Teh manis/tawar, es atau anget.",
    image: img("photo-1556679343-c7306c1976bc"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_teh_es_manis",
        name: "Es Teh Manis",
        price: 4000,
        stock: 40,
        image: img("photo-1556679343-c7306c1976bc"),
      },
      {
        id: "var_teh_es_tawar",
        name: "Es Teh Tawar",
        price: 3000,
        stock: 35,
        image: img("photo-1499638673689-79a0b5115d87"),
      },
      {
        id: "var_teh_anget_manis",
        name: "Teh Anget Manis",
        price: 4000,
        stock: 25,
        image: img("photo-1571934811356-5cc061b6821f"),
      },
      {
        id: "var_teh_anget_tawar",
        name: "Teh Anget Tawar",
        price: 3000,
        stock: 20,
        image: img("photo-1544787219-7f47ccb76574"),
      },
    ],
  },
  {
    id: "prod_s1_nasgor",
    seller_id: "seller_1",
    name: "Nasi Goreng",
    category: "Makanan",
    description: "Nasi goreng pilihan.",
    image: img("photo-1512058564366-18510be2db19"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_nasgor_spesial",
        name: "Nasi Goreng Spesial",
        price: 15000,
        stock: 18,
        image: img("photo-1512058564366-18510be2db19"),
      },
      {
        id: "var_nasgor_seafood",
        name: "Nasi Goreng Seafood",
        price: 18000,
        stock: 10,
        image: img("photo-1603133872878-684f208fb84b"),
      },
    ],
  },
  {
    id: "prod_s2_bakso",
    seller_id: "seller_2",
    name: "Bakso",
    category: "Makanan",
    description: "Bakso sapi.",
    image: img("photo-1529042410759-befb1204b468"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_bakso_urat",
        name: "Bakso Urat Jumbo",
        price: 15000,
        stock: 18,
        image: img("photo-1529042410759-befb1204b468"),
      },
      {
        id: "var_bakso_biasa",
        name: "Bakso Biasa",
        price: 12000,
        stock: 22,
        image: img("photo-1591814468924-caf88d1232e1"),
      },
      {
        id: "var_bakso_komplit",
        name: "Bakso Komplit",
        price: 17000,
        stock: 12,
        image: img("photo-1504674900247-0877df9cc836"),
      },
    ],
  },
  {
    id: "prod_s2_mieayam",
    seller_id: "seller_2",
    name: "Mie Ayam",
    category: "Makanan",
    description: "Mie ayam.",
    image: img("photo-1569718212165-3a8278d5f624"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_mieayam_bakso",
        name: "Mie Ayam Bakso",
        price: 14000,
        stock: 20,
        image: img("photo-1569718212165-3a8278d5f624"),
      },
      {
        id: "var_mieayam_yamin",
        name: "Mie Ayam Yamin",
        price: 14000,
        stock: 16,
        image: img("photo-1612929633738-8fe44f7ec841"),
      },
    ],
  },
  {
    id: "prod_s2_pangsit",
    seller_id: "seller_2",
    name: "Pangsit",
    category: "Snack",
    description: "Pangsit goreng.",
    image: img("photo-1496116218417-1a781b1c416c"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_pangsit_5",
        name: "Pangsit Goreng (5 pcs)",
        price: 8000,
        stock: 25,
        image: img("photo-1496116218417-1a781b1c416c"),
      },
    ],
  },
  {
    id: "prod_s3_jeruk",
    seller_id: "seller_3",
    name: "Jeruk",
    category: "Minuman",
    description: "Jeruk peras.",
    image: img("photo-1621506289937-a8e4df240d0b"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_jeruk_es",
        name: "Es Jeruk Peras",
        price: 6000,
        stock: 30,
        image: img("photo-1621506289937-a8e4df240d0b"),
      },
      {
        id: "var_jeruk_panas",
        name: "Jeruk Hangat",
        price: 5500,
        stock: 20,
        image: img("photo-1600271886742-f049cd451bba"),
      },
    ],
  },
  {
    id: "prod_s3_coklat",
    seller_id: "seller_3",
    name: "Coklat",
    category: "Minuman",
    description: "Coklat susu.",
    image: img("photo-1517578239113-b03992cec17b"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_coklat_es",
        name: "Es Coklat",
        price: 7000,
        stock: 28,
        image: img("photo-1517578239113-b03992cec17b"),
      },
      {
        id: "var_coklat_panas",
        name: "Coklat Hangat",
        price: 7000,
        stock: 15,
        image: img("photo-1542990253-0d0f5be5f0ed"),
      },
    ],
  },
  {
    id: "prod_s3_air",
    seller_id: "seller_3",
    name: "Air Mineral",
    category: "Minuman",
    description: "Air mineral botol.",
    image: img("photo-1548839140-29a749e1cf4d"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_air_600",
        name: "Air Mineral 600ml",
        price: 3500,
        stock: 80,
        image: img("photo-1548839140-29a749e1cf4d"),
      },
    ],
  },
  {
    id: "prod_s4_risoles",
    seller_id: "seller_4",
    name: "Risoles",
    category: "Snack",
    description: "Risoles renyah.",
    image: img("photo-1601050690597-df0568f70950"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_risoles_mayo",
        name: "Risoles Mayo",
        price: 5000,
        stock: 16,
        image: img("photo-1601050690597-df0568f70950"),
      },
      {
        id: "var_risoles_ragout",
        name: "Risoles Ragout",
        price: 5500,
        stock: 12,
        image: img("photo-1626082927389-6cd097cdc6ec"),
      },
    ],
  },
  {
    id: "prod_s4_pisang",
    seller_id: "seller_4",
    name: "Pisang Goreng",
    category: "Snack",
    description: "Pisang goreng isi.",
    image: img("photo-1587132137056-bfbf0166836e"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_pisang_coklat",
        name: "Pisang Goreng Coklat",
        price: 6000,
        stock: 20,
        image: img("photo-1587132137056-bfbf0166836e"),
      },
      {
        id: "var_pisang_keju",
        name: "Pisang Goreng Keju",
        price: 7000,
        stock: 14,
        image: img("photo-1488477181946-6428a0291777"),
      },
    ],
  },
  {
    id: "prod_s4_keripik",
    seller_id: "seller_4",
    name: "Keripik",
    category: "Snack",
    description: "Keripik renyah.",
    image: img("photo-1566478989037-eec170784d0b"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_keripik_kentang",
        name: "Keripik Kentang",
        price: 5000,
        stock: 40,
        image: img("photo-1566478989037-eec170784d0b"),
      },
    ],
  },
  {
    id: "prod_s5_nasi",
    seller_id: "seller_5",
    name: "Nasi",
    category: "Makanan",
    description: "Nasi rames & lauk.",
    image: img("photo-1546069901-ba9599a7e63c"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_nasi_rames",
        name: "Nasi Rames Lengkap",
        price: 13000,
        stock: 30,
        image: img("photo-1546069901-ba9599a7e63c"),
      },
      {
        id: "var_nasi_uduk",
        name: "Nasi Uduk Komplit",
        price: 14000,
        stock: 18,
        image: img("photo-1516684669134-de6f7c473a2a"),
      },
    ],
  },
  {
    id: "prod_s5_ayam",
    seller_id: "seller_5",
    name: "Ayam",
    category: "Makanan",
    description: "Ayam goreng / geprek.",
    image: img("photo-1626082927389-6cd097cdc6ec"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_ayam_geprek",
        name: "Ayam Geprek Sambal",
        price: 16000,
        stock: 15,
        image: img("photo-1626082927389-6cd097cdc6ec"),
      },
      {
        id: "var_ayam_goreng",
        name: "Ayam Goreng Krispi",
        price: 15000,
        stock: 12,
        image: img("photo-1598103442097-8b74394b95c6"),
      },
    ],
  },
  {
    id: "prod_s5_soto",
    seller_id: "seller_5",
    name: "Soto",
    category: "Makanan",
    description: "Soto hangat.",
    image: img("photo-1582878826629-29b7ad1cdc43"),
    is_active: true,
    created_at: now,
    variants: [
      {
        id: "var_soto_ayam",
        name: "Soto Ayam",
        price: 12000,
        stock: 14,
        image: img("photo-1582878826629-29b7ad1cdc43"),
      },
    ],
  },
];

async function main() {
  console.log("Supabase:", url);

  const { count, error: cErr } = await sb
    .from("sellers")
    .select("*", { count: "exact", head: true });
  if (cErr) throw cErr;

  if ((count || 0) > 0 && !force) {
    console.log(`Already has ${count} sellers. Use --force to reseed.`);
    return;
  }

  if (force) {
    console.log("Force wipe…");
    await sb.from("order_items").delete().gte("id", 0);
    await sb.from("orders").delete().neq("id", "");
    await sb.from("product_variants").delete().neq("id", "");
    await sb.from("products").delete().neq("id", "");
    await sb.from("users").delete().neq("id", "");
    await sb.from("sellers").delete().neq("id", "");
  }

  let { error } = await sb.from("sellers").upsert(sellers);
  if (error) throw new Error("sellers: " + error.message);
  console.log("✓ sellers", sellers.length);

  ({ error } = await sb.from("users").upsert(users));
  if (error) throw new Error("users: " + error.message);
  console.log("✓ users", users.length);

  const productRows = products.map(({ variants, ...p }) => p);
  ({ error } = await sb.from("products").upsert(productRows));
  if (error) throw new Error("products: " + error.message);
  console.log("✓ products", productRows.length);

  const variantRows = products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      product_id: p.id,
      name: v.name,
      price: v.price,
      stock: v.stock,
      image: v.image || null,
      is_active: true,
    }))
  );
  ({ error } = await sb.from("product_variants").upsert(variantRows));
  if (error) throw new Error("variants: " + error.message);
  console.log("✓ variants", variantRows.length);

  ({ error } = await sb.from("platform_settings").upsert({
    id: 1,
    school_name: "SMK Negeri 17",
    commission_rate: 7,
    platform_whatsapp: "",
    order_seq: 0,
    updated_at: now,
  }));
  if (error) throw new Error("settings: " + error.message);
  console.log("✓ settings");

  console.log("\nSeed selesai. Refresh app KantinKu.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
