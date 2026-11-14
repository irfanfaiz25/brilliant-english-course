import { describe, expect, it, vi } from "vitest";

import { activityFixtures } from "@/db/seed/content/activities";

import { activityFormSchema, activitySchema } from "./schema";
import { uniqueSlug } from "./service";

// `service.ts` also writes activities; these checks do not need the database.
vi.mock("@/db/client", () => ({ db: {} }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));

describe("activities", () => {
  it("fixtures are valid and aligned across locales", () => {
    activityFixtures.id.forEach((a) => expect(() => activitySchema.parse(a)).not.toThrow());
    activityFixtures.en.forEach((a) => expect(() => activitySchema.parse(a)).not.toThrow());
    expect(activityFixtures.en.map((a) => a.slug)).toEqual(activityFixtures.id.map((a) => a.slug));
  });
});

describe("uniqueSlug", () => {
  it("adds the first free number when the slug is taken", () => {
    expect(uniqueSlug("book-day", new Set())).toBe("book-day");
    expect(uniqueSlug("book-day", new Set(["book-day", "book-day-2"]))).toBe("book-day-3");
  });

  it("never returns an empty slug", () => {
    expect(uniqueSlug("", new Set())).toBe("kegiatan");
  });
});

describe("activityFormSchema", () => {
  const fixture = activityFixtures.id[0];
  if (!fixture) throw new Error("Missing activity fixture");
  const text = {
    name: fixture.name,
    summary: fixture.summary,
    audience: fixture.audience,
    imageAlt: fixture.image.alt,
  };

  it("requires both locales", () => {
    const result = activityFormSchema.safeParse({
      imageId: "8f14e45f-ceea-4672-8b67-6d1b1c5f8c11",
      isPublished: true,
      texts: { id: text, en: { ...text, name: "", summary: "pendek" } },
    });
    expect(result.error?.issues.map((i) => `${i.path.join(".")}=${i.message}`)).toEqual([
      "texts.en.name=tooShort:2",
      "texts.en.summary=tooShort:20",
    ]);
  });
});
