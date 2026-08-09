/**
 * Update nomor WhatsApp platform di Supabase (row platform_settings id=1)
 * Tanpa menghapus data lain.
 *   node scripts/update-whatsapp.mjs
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
const WA = "6285810383881";

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY in .env.local");
  process.exit(1);
}

const sb = createClient(url, key);

const { data: existing, error: getErr } = await sb
  .from("platform_settings")
  .select("id")
  .eq("id", 1)
  .maybeSingle();

if (getErr) {
  console.error("Gagal baca platform_settings:", getErr.message);
  process.exit(1);
}

if (!existing) {
  console.log("Row platform_settings id=1 belum ada — seed dulu lewat seed-supabase.mjs.");
  process.exit(1);
}

const { error } = await sb
  .from("platform_settings")
  .update({ platform_whatsapp: WA, updated_at: new Date().toISOString() })
  .eq("id", 1);

if (error) {
  console.error("Gagal update platform_whatsapp:", error.message);
  process.exit(1);
}

console.log(`OK: platform_settings id=1 platform_whatsapp -> ${WA}`);
