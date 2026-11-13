import { describe, expect, it } from "vitest";

import { faqPageJsonLd, serializeJsonLd } from "./json-ld";

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
});
