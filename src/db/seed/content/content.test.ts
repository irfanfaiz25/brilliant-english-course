import { describe, expect, it } from "vitest";

import { faqFixtures } from "@/db/seed/content/faq";
import { faqItemSchema } from "@/features/faq/schema";
import { testimonialFixtures } from "@/db/seed/content/testimonials";
import { testimonialSchema } from "@/features/testimonials/schema";
import { unitFixtures } from "@/db/seed/content/units";
import { unitSummarySchema } from "@/features/units/schema";

describe("content fixtures", () => {
  it("testimonials are valid and aligned across locales", () => {
    [...testimonialFixtures.id, ...testimonialFixtures.en].forEach((t) =>
      testimonialSchema.parse(t),
    );
    expect(testimonialFixtures.en.map((t) => t.id)).toEqual(
      testimonialFixtures.id.map((t) => t.id),
    );
  });

  it("FAQ items are valid and aligned across locales", () => {
    [...faqFixtures.id, ...faqFixtures.en].forEach((item) => faqItemSchema.parse(item));
    expect(faqFixtures.en.map((i) => i.id)).toEqual(faqFixtures.id.map((i) => i.id));
  });

  it("sample units are valid", () => {
    unitFixtures.forEach((unit) => unitSummarySchema.parse(unit));
  });
});
