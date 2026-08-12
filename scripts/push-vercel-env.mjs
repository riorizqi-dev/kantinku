/**
 * Push env production/preview ke Vercel (non-interactive).
 *   node scripts/push-vercel-env.mjs
 *
 * Butuh: vercel login + project linked (.vercel/project.json)
 */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { tmpdir } from "os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const raw = readFileSync(join(root, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const local = loadEnvLocal();
const PROD_URL = "https://kantinku-six.vercel.app";

/** Env untuk Vercel */
const vars = {
  NEXT_PUBLIC_APP_URL: PROD_URL,

  NEXT_PUBLIC_SUPABASE_URL: local.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: local.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  WARUNGERIK_API_KEY: local.WARUNGERIK_API_KEY,
  WARUNGERIK_BASE_URL:
    local.WARUNGERIK_BASE_URL || "https://pg.warungerik.com",

  NEXT_PUBLIC_WARUNGERIK_API_KEY:
    local.NEXT_PUBLIC_WARUNGERIK_API_KEY || local.WARUNGERIK_API_KEY,
  NEXT_PUBLIC_WARUNGERIK_BASE_URL:
    local.NEXT_PUBLIC_WARUNGERIK_BASE_URL || "https://pg.warungerik.com",
};

const targets = ["production", "preview"];

function addEnv(name, value, target) {
  if (!value) {
    console.warn(`SKIP ${name} (empty)`);
    return false;
  }
  // vercel env add reads value from stdin
  const tmp = join(tmpdir(), `vercel-env-${name}-${target}.txt`);
  writeFileSync(tmp, value, "utf8");
  try {
    // Remove existing if any (ignore errors)
    spawnSync(
      "npx",
      ["vercel", "env", "rm", name, target, "-y"],
      { cwd: root, shell: true, encoding: "utf8" }
    );

    const r = spawnSync(
      "npx",
      ["vercel", "env", "add", name, target],
      {
        cwd: root,
        shell: true,
        encoding: "utf8",
        input: value + "\n",
      }
    );
    if (r.status !== 0) {
      console.error(`FAIL ${name} @ ${target}:`, r.stderr || r.stdout);
      return false;
    }
    console.log(`OK  ${name} → ${target}`);
    return true;
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

let ok = 0;
let fail = 0;
for (const [name, value] of Object.entries(vars)) {
  for (const t of targets) {
    if (addEnv(name, value, t)) ok++;
    else fail++;
  }
}

console.log(`\nDone. ok=${ok} fail=${fail}`);
console.log(`Production URL: ${PROD_URL}`);
console.log("Redeploy: npx vercel --prod");
console.log(
  `Webhook callback (opsional): ${PROD_URL}/api/bayar/webhook`
);
