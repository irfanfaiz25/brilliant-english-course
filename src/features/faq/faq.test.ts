import { describe, expect, it } from "vitest";

import { faqFixtures } from "@/db/seed/content/faq";

import { faqListHref } from "./list-href";
import { faqFormSchema, type FaqFormInput } from "./schema";

const issues = (input: unknown) =>
  faqFormSchema
    .safeParse(input)
    .error?.issues.map((issue) => `${issue.path.join(".")}=${issue.message}`) ?? [];

const valid: FaqFormInput = {
  topic: "program",
  isPublished: true,
  texts: {
    id: {
      question: "Berapa lama satu pertemuan?",
      answer: "Sekitar 60 sampai 90 menit, tergantung level.",
    },
    en: { question: "How long is one session?", answer: "About 60 to 90 minutes, by level." },
  },
};

describe("faqFormSchema", () => {
  it("accepts every seeded entry, so admins can save them unchanged", () => {
    faqFixtures.id.forEach((id, index) => {
      const en = faqFixtures.en[index];
      if (!en) throw new Error(`Missing English FAQ ${id.id}`);
      expect(
        issues({
          topic: id.topic,
          isPublished: true,
          texts: {
            id: { question: id.question, answer: id.answer },
            en: { question: en.question, answer: en.answer },
          },
        }),
      ).toEqual([]);
    });
  });

  it("requires both languages and reports codes on the right fields", () => {
    expect(
      issues({ ...valid, texts: { ...valid.texts, en: { question: "Why?", answer: "" } } }),
    ).toEqual(["texts.en.question=tooShort:10", "texts.en.answer=tooShort:20"]);
  });

  it("keeps line breaks inside an answer and trims around it", () => {
    const answer = "  Baris pertama jawaban.\nBaris kedua jawaban.  ";
    const parsed = faqFormSchema.parse({
      ...valid,
      texts: { ...valid.texts, id: { ...valid.texts.id, answer } },
    });
    expect(parsed.texts.id.answer).toBe("Baris pertama jawaban.\nBaris kedua jawaban.");
  });

  it("refuses an unknown topic", () => {
    expect(issues({ ...valid, topic: "pricing" })).toHaveLength(1);
  });
});

describe("faqListHref", () => {
  it("keeps the plain URL for parents, the default tab", () => {
    expect(faqListHref("parents")).toBe("/admin/faq");
    expect(faqListHref("partners")).toBe("/admin/faq?topic=partners");
  });
});
