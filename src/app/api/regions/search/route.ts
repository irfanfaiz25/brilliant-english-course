import { limits } from "@/config/limits";
import { findRegions } from "@/features/regions/search";
import { regionSearchParamsSchema } from "@/features/regions/schema";
import { clientIp, createRateLimiter, isLocalOrUnknownIp } from "@/lib/rate-limit";

const limiter = createRateLimiter({
  limit: limits.regionSearch.rateLimit,
  windowMs: limits.regionSearch.rateWindowMs,
});

/**
 * Region search as you type (ADR-047): `?q=tanah baru&levels=village&quota=1`. A GET route, not a
 * Server Action, so searches can run in parallel and be cancelled while the visitor types.
 * Results are cached per query; the quota part refreshes within minutes.
 */
export async function GET(request: Request) {
  const ip = clientIp(request.headers);
  if (!isLocalOrUnknownIp(ip) && !limiter.hit(ip)) {
    return Response.json({ error: "rateLimited" }, { status: 429 });
  }

  const parsed = regionSearchParamsSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return Response.json({ error: "invalidQuery" }, { status: 400 });

  const results = await findRegions(parsed.data);
  return Response.json({ results }, { headers: { "Cache-Control": "private, max-age=60" } });
}
