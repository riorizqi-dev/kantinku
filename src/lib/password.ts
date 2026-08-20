/**
 * Password hashing tanpa dependency — PBKDF2 via Web Crypto API.
 * Bekerja di browser (crypto.subtle) dan Node 18+ (globalThis.crypto.subtle).
 *
 * Format tersimpan: `pbkdf2$<iter>$<saltHex>$<hashHex>` (SHA-256).
 * Format lama (seed/demo): plain text — tetap bisa diverifikasi via fallback.
 */

const PBKDF2_ITERATIONS = 100_000;
const PREFIX = "pbkdf2$";

function subtle(): SubtleCrypto | undefined {
  const g = globalThis as unknown as { crypto?: { subtle?: SubtleCrypto } };
  return g.crypto?.subtle;
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function randomBytes(n: number): Uint8Array {
  const g = globalThis as unknown as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } };
  const cryptoObj = g.crypto;
  if (cryptoObj?.getRandomValues) return cryptoObj.getRandomValues(new Uint8Array(n));
  const bytes = new Uint8Array(n);
  for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const imp = subtle();
  if (!imp) throw new Error("Web Crypto tidak tersedia");
  const key = await imp.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return imp.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
    key,
    256
  );
}

/** Hash password → `pbkdf2$<iter>$<salt>$<hash>` */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(plain, salt, PBKDF2_ITERATIONS);
  return `${PREFIX}${PBKDF2_ITERATIONS}$${bytesToHex(salt.buffer as ArrayBuffer)}$${bytesToHex(hash)}`;
}

/** Cek password. Mendukung hash PBKDF2 baru + plain text lama (seed demo). */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored.startsWith(PREFIX)) {
    // Legacy: password plain text (akun seed/demo lama)
    return plain === stored;
  }
  const [, iterStr, saltHex, hashHex] = stored.split("$");
  const iterations = Number(iterStr) || PBKDF2_ITERATIONS;
  try {
    const hash = await derive(plain, hexToBytes(saltHex), iterations);
    const expected = hexToBytes(hashHex);
    const actual = new Uint8Array(hash);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}