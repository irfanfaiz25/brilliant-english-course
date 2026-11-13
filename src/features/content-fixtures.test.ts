import { describe, expect, it } from "vitest";

import { faqFixtures } from "./faq/fixtures";
import { faqItemSchema } from "./faq/schema";
import { testimonialFixtures } from "./testimonials/fixtures";
import { testimonialSchema } from "./testimonials/schema";
import { unitFixtures } from "./units/fixtures";
import { unitSummarySchema } from "./units/schema";

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
