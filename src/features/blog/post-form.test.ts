import { describe, expect, it } from "vitest";

import { emptyPostText, postFormSchema, type PostFormInput } from "./schema";
import { fromJakartaInput, toJakartaInput } from "./service";

const body = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Isi artikel." }] }],
};
const text = {
  title: "Tips belajar di rumah",
  slug: "tips-belajar-di-rumah",
  excerpt: "Lima kebiasaan kecil yang membuat anak senang belajar bahasa Inggris.",
  coverAlt: "Anak membaca buku",
  content: body,
};
const valid: PostFormInput = {
  category: "tips-belajar",
  coverImageId: "0b6c1f0e-8c4b-4c11-9a35-6f1e2f6b3a10",
  authorName: "Tim BEC",
  authorRole: "Kurikulum",
  status: "draft",
  publishedAt: "",
  texts: { id: text, en: emptyPostText() },
};

const errorsOf = (input: PostFormInput) => {
  const result = postFormSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
};

describe("postFormSchema", () => {
  it("treats an empty English version as no translation", () => {
    const parsed = postFormSchema.parse(valid);
    expect(parsed.texts.en).toBeNull();
    expect(parsed.texts.id.content.content).toHaveLength(1);
  });

  it("requires a started English version to be complete", () => {
    expect(
      errorsOf({
        ...valid,
        texts: { ...valid.texts, en: { ...emptyPostText(), title: "Study tips at home" } },
      }),
    ).toEqual({
      "texts.en.slug": "translationIncomplete",
      "texts.en.excerpt": "tooShort:20",
      "texts.en.coverAlt": "translationIncomplete",
      "texts.en.content": "contentRequired",
    });
    const parsed = postFormSchema.parse({
      ...valid,
      texts: { ...valid.texts, en: { ...text, slug: "study-tips" } },
    });
    expect(parsed.texts.en?.slug).toBe("study-tips");
  });

  it("checks the Indonesian version, slug format and publish date", () => {
    expect(
      errorsOf({
        ...valid,
        publishedAt: "14/11/2026",
        texts: {
          ...valid.texts,
          id: { ...text, slug: "Tips Belajar", content: { type: "doc", content: [] } },
        },
      }),
    ).toEqual({
      publishedAt: "dateInvalid",
      "texts.id.slug": "slugInvalid",
      "texts.id.content": "contentRequired",
    });
  });
});

describe("Jakarta datetime inputs", () => {
  it("round-trips through UTC+7", () => {
    const instant = fromJakartaInput("2026-11-14T09:30");
    expect(instant.toISOString()).toBe("2026-11-14T02:30:00.000Z");
    expect(toJakartaInput(instant)).toBe("2026-11-14T09:30");
    expect(toJakartaInput(new Date("2026-11-14T20:00:00Z"))).toBe("2026-11-15T03:00");
  });
});
