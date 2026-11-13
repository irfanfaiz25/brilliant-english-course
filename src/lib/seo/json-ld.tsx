/** A schema.org object; `@context` is added by `JsonLd`. */
export type JsonLdThing = { "@type": string } & Record<string, unknown>;

/** Serializes JSON-LD safely for an inline script (escapes `<` to prevent tag injection). */
export function serializeJsonLd(data: JsonLdThing): string {
  return JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");
}

/** Renders structured data as recommended by Next.js (inline script in the page). */
export function JsonLd({ data }: { data: JsonLdThing }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

/** `FAQPage` from question/answer pairs (AGENTS.md § 4 SEO). */
export function faqPageJsonLd(items: readonly { question: string; answer: string }[]): JsonLdThing {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
