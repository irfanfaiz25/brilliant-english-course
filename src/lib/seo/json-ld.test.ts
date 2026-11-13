import { describe, expect, it } from "vitest";

import { breadcrumbJsonLd, courseJsonLd, faqPageJsonLd, serializeJsonLd } from "./json-ld";

describe("JSON-LD", () => {
  it("adds the schema.org context and escapes tags", () => {
    const json = serializeJsonLd({ "@type": "Thing", name: "</script><b>x</b>" });
    expect(json).toContain('"@context":"https://schema.org"');
    expect(json).not.toContain("<");
  });

  it("builds a FAQPage", () => {
    expect(faqPageJsonLd([{ question: "Q?", answer: "A." }])).toEqual({
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } },
      ],
    });
  });

  it("numbers breadcrumb items from 1", () => {
    const data = breadcrumbJsonLd([
      { name: "Beranda", url: "https://bec.test/" },
      { name: "Program", url: "https://bec.test/program" },
    ]);
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Beranda", item: "https://bec.test/" },
      { "@type": "ListItem", position: 2, name: "Program", item: "https://bec.test/program" },
    ]);
  });

  it("builds a Course with provider and age audience", () => {
    const data = courseJsonLd({
      name: "Kindy",
      description: "Desc",
      url: "https://bec.test/program#kindy",
      teaches: ["Phonics"],
      minAge: 4,
      maxAge: 6,
      inLanguage: "id",
      provider: { name: "BEC", url: "https://bec.test" },
    });
    expect(data).toMatchObject({
      "@type": "Course",
      audience: { suggestedMinAge: 4, suggestedMaxAge: 6 },
      provider: { "@type": "EducationalOrganization", name: "BEC" },
    });
  });
});
