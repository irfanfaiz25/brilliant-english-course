import { describe, expect, it } from "vitest";

import { testimonialFixtures } from "@/db/seed/content/testimonials";

import { testimonialListHref } from "./list-href";
import { testimonialFormSchema, type TestimonialFormInput } from "./schema";

const issues = (input: unknown) =>
  testimonialFormSchema
    .safeParse(input)
    .error?.issues.map((issue) => `${issue.path.join(".")}=${issue.message}`) ?? [];

const valid: TestimonialFormInput = {
  audience: "parent",
  authorName: "Ibu Sari",
  rating: 5,
  isPublished: true,
  texts: {
    id: { quote: "Anak saya jadi berani bicara bahasa Inggris.", role: "Orang tua siswa Kindy" },
    en: { quote: "My child now dares to speak English.", role: "Parent of a Kindy student" },
  },
};

describe("testimonialFormSchema", () => {
  it("accepts every seeded testimonial, so admins can save them unchanged", () => {
    testimonialFixtures.id.forEach((id, index) => {
      const en = testimonialFixtures.en[index];
      if (!en) throw new Error(`Missing English testimonial ${id.id}`);
      expect(
        issues({
          audience: id.audience,
          authorName: id.author,
          rating: id.rating,
          isPublished: true,
          texts: { id: { quote: id.quote, role: id.role }, en: { quote: en.quote, role: en.role } },
        }),
      ).toEqual([]);
    });
  });

  it("requires both languages and reports codes on the right fields", () => {
    expect(
      issues({ ...valid, texts: { ...valid.texts, en: { quote: "Short", role: "" } } }),
    ).toEqual(["texts.en.quote=tooShort:20", "texts.en.role=tooShort:3"]);
  });

  it("keeps the rating between 1 and 5 stars", () => {
    expect(issues({ ...valid, rating: 0 })).toEqual(["rating=numberMin:1"]);
    expect(issues({ ...valid, rating: 6 })).toEqual(["rating=numberMax:5"]);
    expect(issues({ ...valid, rating: 4.5 })).toEqual(["rating=numberRequired"]);
  });

  it("trims text and refuses an unknown audience", () => {
    const parsed = testimonialFormSchema.parse({ ...valid, authorName: "  Ibu Sari  " });
    expect(parsed.authorName).toBe("Ibu Sari");
    expect(issues({ ...valid, audience: "teacher" })).toHaveLength(1);
  });
});

describe("testimonialListHref", () => {
  it("keeps the plain URL for parents, the default tab", () => {
    expect(testimonialListHref("parent")).toBe("/admin/testimoni");
    expect(testimonialListHref("partner")).toBe("/admin/testimoni?audience=partner");
  });
});
