import "server-only";

type RateLimiterOptions = {
  /** Requests allowed per key within the window. */
  limit: number;
  windowMs: number;
};

/**
 * Fixed-window, in-memory rate limiter keyed by e.g. client IP. Good enough for one app instance
 * behind Cloudflare; move the counters to Postgres if the app ever runs on several instances.
 */
export function createRateLimiter({ limit, windowMs }: RateLimiterOptions) {
  const windows = new Map<string, { count: number; resetAt: number }>();

  return {
    /** Counts a hit for `key`; returns false once the key is over its limit for this window. */
    hit(key: string, now: number = Date.now()): boolean {
      // Drop expired windows so the map does not grow without bound.
      if (windows.size > 10_000) {
        for (const [storedKey, window] of windows) {
          if (window.resetAt <= now) windows.delete(storedKey);
        }
      }
      const current = windows.get(key);
      if (!current || current.resetAt <= now) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    },
  };
}

/** Client IP behind Cloudflare / a reverse proxy, or "unknown". */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
