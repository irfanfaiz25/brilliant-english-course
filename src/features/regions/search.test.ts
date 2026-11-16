import { beforeEach, describe, expect, it, vi } from "vitest";

import { regionSearchParamsSchema } from "./schema";

const { searchRegions, getVillageQuotas } = vi.hoisted(() => ({
  searchRegions: vi.fn(),
  getVillageQuotas: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("./queries", () => ({ searchRegions }));
vi.mock("@/features/quota/queries", () => ({ getVillageQuotas }));

const { findRegions } = await import("./search");

describe("regionSearchParamsSchema", () => {
  it("normalises the text and sorts the levels for a stable cache key", () => {
    expect(
      regionSearchParamsSchema.parse({ q: "  Tanah   BARU ", levels: "village,district,village" }),
    ).toEqual({ q: "tanah baru", levels: ["district", "village"], quota: false });
  });

  it("reads 'kab' as 'kabupaten', like the official names", () => {
    expect(regionSearchParamsSchema.parse({ q: "Kab. Bogor" }).q).toBe("kabupaten bogor");
    expect(regionSearchParamsSchema.parse({ q: "kab bogor" }).q).toBe("kabupaten bogor");
  });

  it("defaults to villages without quota", () => {
    expect(regionSearchParamsSchema.parse({ q: "beji" })).toMatchObject({
      levels: ["village"],
      quota: false,
    });
  });

  it("refuses too short or too long text and unknown levels", () => {
    expect(regionSearchParamsSchema.safeParse({ q: "ab" }).success).toBe(false);
    expect(regionSearchParamsSchema.safeParse({ q: "x".repeat(61) }).success).toBe(false);
    expect(regionSearchParamsSchema.safeParse({ q: "beji", levels: "planet" }).success).toBe(false);
  });
});

describe("findRegions", () => {
  beforeEach(() => {
    searchRegions.mockReset();
    getVillageQuotas.mockReset();
    searchRegions.mockResolvedValue([
      { code: "32.76.06", name: "Beji", level: "district", area: "Kota Depok, Jawa Barat" },
      {
        code: "32.76.06.1001",
        name: "Beji",
        level: "village",
        area: "Beji, Kota Depok, Jawa Barat",
      },
    ]);
  });

  it("returns the matches as they are when quota is not asked", async () => {
    const results = await findRegions({ q: "beji", levels: ["district", "village"], quota: false });
    expect(results.map((result) => result.quota)).toEqual([undefined, undefined]);
    expect(getVillageQuotas).not.toHaveBeenCalled();
  });

  it("adds the quota of villages only", async () => {
    getVillageQuotas.mockResolvedValue([
      { villageCode: "32.76.06.1001", status: "almostFull", remaining: 1 },
    ]);
    const results = await findRegions({ q: "beji", levels: ["district", "village"], quota: true });
    expect(getVillageQuotas).toHaveBeenCalledWith(["32.76.06.1001"]);
    expect(results[0]?.quota).toBeUndefined();
    expect(results[1]?.quota).toEqual({ status: "almostFull", remaining: 1 });
  });
});
