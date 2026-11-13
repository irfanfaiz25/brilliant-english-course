import { describe, expect, it } from "vitest";

import { limits } from "@/config/limits";

import { computeVillageQuota, quotaStatus } from "./service";

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
    expect(computeVillageQuota(VILLAGE, units, [], 2)).toMatchObject({
      activeUnits: 1,
      reserved: 0,
      remaining: 1,
      status: "almostFull",
    });
  });

  it("subtracts reservations and never goes below zero", () => {
    const quota = computeVillageQuota(VILLAGE, units, [{ villageCode: VILLAGE, slots: 3 }], 2);
    expect(quota).toMatchObject({ reserved: 3, remaining: 0, status: "full" });
  });

  it("is fully open for a village without units", () => {
    expect(computeVillageQuota("32.01.01.1003", units, [], 2)).toMatchObject({
      remaining: 2,
      status: "available",
    });
  });
});
