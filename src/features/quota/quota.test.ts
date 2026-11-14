import { describe, expect, it, vi } from "vitest";

import { limits } from "@/config/limits";

import { quotaRulesSchema } from "./schema";
import { computeVillageQuota, quotaFromCounts, quotaStatus, reservationExpiry } from "./service";

// `service.ts` also writes reservations; these checks do not need the database.
vi.mock("@/db/client", () => ({ db: {} }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));

const twoPerVillage = { unitsPerVillage: 2, almostFullAt: 1 };

const VILLAGE = "32.01.05.2001";
const units = [{ villageCode: VILLAGE }, { villageCode: "32.01.01.1001" }];

describe("quotaStatus", () => {
  it("is full at zero and almost full at the threshold", () => {
    expect(quotaStatus(0)).toBe("full");
    expect(quotaStatus(limits.quotaAlmostFullAt)).toBe("almostFull");
    expect(quotaStatus(limits.quotaAlmostFullAt + 1)).toBe("available");
  });
});

describe("computeVillageQuota", () => {
  it("counts active units in the village only", () => {
    expect(computeVillageQuota(VILLAGE, units, [], twoPerVillage)).toMatchObject({
      activeUnits: 1,
      reserved: 0,
      remaining: 1,
      status: "almostFull",
    });
  });

  it("subtracts reservations and never goes below zero", () => {
    const quota = computeVillageQuota(
      VILLAGE,
      units,
      [{ villageCode: VILLAGE, slots: 3 }],
      twoPerVillage,
    );
    expect(quota).toMatchObject({ reserved: 3, remaining: 0, status: "full" });
  });

  it("is fully open for a village without units", () => {
    expect(computeVillageQuota("32.01.01.1003", units, [], twoPerVillage)).toMatchObject({
      remaining: 2,
      status: "available",
    });
  });
});

describe("quota rules", () => {
  it("uses the admin's almost-full threshold", () => {
    const rules = { unitsPerVillage: 5, almostFullAt: 2 };
    expect(quotaFromCounts("32.01.05.2001", 2, 1, rules)).toMatchObject({
      max: 5,
      remaining: 2,
      status: "almostFull",
    });
    expect(quotaStatus(3, 2)).toBe("available");
  });

  it("keeps the threshold below the maximum", () => {
    const result = quotaRulesSchema.safeParse({ unitsPerVillage: 2, almostFullAt: 2 });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["almostFullAt"],
      message: "almostFullTooHigh",
    });
    expect(quotaRulesSchema.safeParse({ unitsPerVillage: 0, almostFullAt: 0 }).success).toBe(false);
  });
});

describe("reservationExpiry", () => {
  it("holds the slots through the chosen day in WIB", () => {
    expect(reservationExpiry("2026-12-31")?.toISOString()).toBe("2026-12-31T16:59:59.000Z");
    expect(reservationExpiry("")).toBeNull();
  });
});
