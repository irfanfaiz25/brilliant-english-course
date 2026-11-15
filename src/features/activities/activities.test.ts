import { describe, expect, it, vi } from "vitest";

import { activityFixtures } from "@/db/seed/content/activities";

import { activityFormSchema, activitySchema } from "./schema";
import { toRows } from "@/lib/form-schemas";
import { uniqueSlug } from "@/lib/slug";

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
    expect(uniqueSlug("book-day", new Set(), "kegiatan")).toBe("book-day");
    expect(uniqueSlug("book-day", new Set(["book-day", "book-day-2"]), "kegiatan")).toBe(
      "book-day-3",
    );
  });

  it("never returns an empty slug", () => {
    expect(uniqueSlug("", new Set(), "kegiatan")).toBe("kegiatan");
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
    description: fixture.description,
    schedule: fixture.schedule,
    highlights: toRows(fixture.highlights),
    skills: toRows(fixture.skills),
  };
  const photo = { imageId: "8f14e45f-ceea-4672-8b67-6d1b1c5f8c12", caption: { id: "", en: "" } };

  it("requires both locales", () => {
    const result = activityFormSchema.safeParse({
      imageId: "8f14e45f-ceea-4672-8b67-6d1b1c5f8c11",
      isPublished: true,
      texts: { id: text, en: { ...text, name: "", summary: "pendek" } },
      photos: [],
    });
    expect(result.error?.issues.map((i) => `${i.path.join(".")}=${i.message}`)).toEqual([
      "texts.en.name=tooShort:2",
      "texts.en.summary=tooShort:20",
    ]);
  });

  it("keeps the popup details optional but bounded", () => {
    const minimal = { ...text, description: "", schedule: "", highlights: [], skills: [] };
    const parsed = activityFormSchema.parse({
      imageId: photo.imageId,
      isPublished: true,
      texts: { id: minimal, en: minimal },
      photos: [],
    });
    expect(parsed.texts.id.highlights).toEqual([]);

    const missing = activityFormSchema.safeParse({
      imageId: photo.imageId,
      isPublished: true,
      texts: { id: minimal, en: minimal },
      photos: [{ imageId: "", caption: photo.caption }],
    });
    expect(missing.error?.issues.map((i) => i.path.join("."))).toEqual(["photos.0.imageId"]);

    const result = activityFormSchema.safeParse({
      imageId: photo.imageId,
      isPublished: true,
      texts: {
        id: { ...text, highlights: toRows(Array.from({ length: 7 }, (_, i) => `Langkah ${i}`)) },
        en: text,
      },
      photos: [...Array.from({ length: 8 }, () => photo), photo],
    });
    expect(result.error?.issues.map((i) => `${i.path.join(".")}=${i.message}`)).toEqual([
      "texts.id.highlights=tooMany:6",
      "photos=tooMany:8",
    ]);
  });
});
