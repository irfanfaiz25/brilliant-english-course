import { describe, expect, it } from "vitest";

import { clientIp, createRateLimiter, isLocalOrUnknownIp } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows `limit` hits per window, per key", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect([limiter.hit("a", 0), limiter.hit("a", 1), limiter.hit("a", 2)]).toEqual([
      true,
      true,
      false,
    ]);
    expect(limiter.hit("b", 2)).toBe(true);
    expect(limiter.hit("a", 1000)).toBe(true);
  });

  it("reports a used-up key without counting, and forgets a reset key", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    limiter.hit("a", 0);
    expect(limiter.isBlocked("a", 1)).toBe(false);
    limiter.hit("a", 1);
    expect(limiter.isBlocked("a", 2)).toBe(true);
    expect(limiter.isBlocked("a", 1000)).toBe(false);
    limiter.reset("a");
    expect(limiter.isBlocked("a", 3)).toBe(false);
    expect(limiter.hit("a", 3)).toBe(true);
  });
});

describe("isLocalOrUnknownIp", () => {
  it("matches loopback and unknown addresses only", () => {
    for (const ip of ["unknown", "::1", "127.0.0.1", "::ffff:127.0.0.1"]) {
      expect(isLocalOrUnknownIp(ip)).toBe(true);
    }
    expect(isLocalOrUnknownIp("203.0.113.7")).toBe(false);
  });
});

describe("clientIp", () => {
  it("prefers Cloudflare, then the first forwarded address", () => {
    expect(
      clientIp(new Headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" })),
    ).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "3.3.3.3, 10.0.0.1" }))).toBe("3.3.3.3");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
