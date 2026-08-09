/**
 * Rate limiter in-memory sederhana per-IP.
 * Window bergulir (sliding window): hanya permintaan dalam `windowMs` terakhir
 * yang dihitung terhadap batas `max`. Cocok untuk single-instance deployment
 * demo; untuk multi-instance pakai Redis/external store.
 */

type Bucket = {
  timestamps: number[];
};

const WINDOW_MS_DEFAULT = 60_000;
const MAX_DEFAULT = 30;
const MAX_BUCKETS = 10_000;

const buckets = new Map<string, Bucket>();

function prune(now: number, windowMs: number) {
  buckets.forEach((b, key) => {
    if (b.timestamps.length && now - b.timestamps[0] > windowMs) {
      b.timestamps = b.timestamps.filter((t) => now - t <= windowMs);
      if (!b.timestamps.length) buckets.delete(key);
    }
  });
  if (buckets.size > MAX_BUCKETS) {
    // Fallback darurat: kosongkan semua kalau kebanyakan bucket
    buckets.clear();
  }
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
};

export function rateLimit(
  key: string,
  opts?: { max?: number; windowMs?: number }
): RateLimitResult {
  const windowMs = opts?.windowMs || WINDOW_MS_DEFAULT;
  const max = opts?.max || MAX_DEFAULT;
  const now = Date.now();

  prune(now, windowMs);

  const bucket = buckets.get(key) || { timestamps: [] };
  const recent = bucket.timestamps.filter((t) => now - t <= windowMs);

  if (recent.length >= max) {
    buckets.set(key, { timestamps: recent });
    const oldest = recent[0] || now;
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + windowMs - now),
    };
  }

  recent.push(now);
  buckets.set(key, { timestamps: recent });
  return {
    allowed: true,
    limit: max,
    remaining: max - recent.length,
    retryAfterMs: 0,
  };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function rateLimitHeader(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
  };
}
