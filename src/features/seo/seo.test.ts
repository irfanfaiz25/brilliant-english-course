import { describe, expect, it } from "vitest";

import { applySeoOverride, formatPageTitle } from "./format";
import { pageSeoSchema, seoDefaultsSchema, type DerivedSeo } from "./schema";

const derived: DerivedSeo = {
  title: "Kontak",
  description: "Hubungi BEC lewat WhatsApp atau email untuk info kursus dan kemitraan.",
  absoluteTitle: false,
};
const noOverride = { title: null, description: null, noindex: false };

describe("applySeoOverride", () => {
  it("keeps the page's own metadata without an override", () => {
    expect(applySeoOverride(derived, null)).toEqual({
      title: derived.title,
      description: derived.description,
    });
    expect(applySeoOverride(derived, noOverride)).toEqual(applySeoOverride(derived, null));
  });

  it("prefers the admin override, field by field", () => {
    expect(applySeoOverride(derived, { ...noOverride, title: "Hubungi Kami" })).toEqual({
      title: "Hubungi Kami",
      description: derived.description,
    });
  });

  it("leaves the description to the global default when nobody set one", () => {
    expect(applySeoOverride({ ...derived, description: null }, null)).toEqual({ title: "Kontak" });
  });

  it("keeps complete titles complete", () => {
    expect(
      applySeoOverride({ ...derived, absoluteTitle: true }, { ...noOverride, title: "BEC" }),
    ).toMatchObject({ title: { absolute: "BEC" } });
  });

  it("asks crawlers not to index, but to follow links", () => {
    expect(applySeoOverride(derived, { ...noOverride, noindex: true }).robots).toEqual({
      index: false,
      follow: true,
    });
  });
});

describe("formatPageTitle", () => {
  it("adds the site name unless the title is complete", () => {
    expect(formatPageTitle("Kontak", false)).toBe("Kontak · BEC");
    expect(formatPageTitle("Brilliant English Course", true)).toBe("Brilliant English Course");
  });
});

describe("pageSeoSchema", () => {
  const input = (id: { title: string; description: string }) => ({
    page: "contact",
    texts: { id, en: { title: "", description: "" } },
    noindex: false,
  });

  it("turns empty fields into null (use the default)", () => {
    expect(pageSeoSchema.parse(input({ title: "  ", description: "" })).texts.id).toEqual({
      title: null,
      description: null,
    });
  });

  it("limits lengths to what search results show", () => {
    const result = pageSeoSchema.safeParse(
      input({ title: "x".repeat(71), description: "Terlalu pendek" }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message).sort()).toEqual([
      "descriptionTooShort",
      "titleTooLong",
    ]);
  });

  it("rejects unknown pages", () => {
    expect(
      pageSeoSchema.safeParse({ ...input({ title: "", description: "" }), page: "admin" }).success,
    ).toBe(false);
  });
});

describe("seoDefaultsSchema", () => {
  it("needs a description in every locale", () => {
    expect(
      seoDefaultsSchema.safeParse({ description: { id: derived.description, en: "" } }).success,
    ).toBe(false);
  });
});
