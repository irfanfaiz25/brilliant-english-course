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

/** `BreadcrumbList` from absolute URLs, in order from the home page. */
export function breadcrumbJsonLd(items: readonly { name: string; url: string }[]): JsonLdThing {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

type CourseInput = {
  name: string;
  description: string;
  url: string;
  teaches: readonly string[];
  minAge: number;
  maxAge: number;
  inLanguage: string;
  provider: { name: string; url: string };
};

/** `Course` for a program level (Google course rich results need name, description and provider). */
export function courseJsonLd(course: CourseInput): JsonLdThing {
  return {
    "@type": "Course",
    name: course.name,
    description: course.description,
    url: course.url,
    inLanguage: course.inLanguage,
    teaches: course.teaches,
    audience: {
      "@type": "PeopleAudience",
      suggestedMinAge: course.minAge,
      suggestedMaxAge: course.maxAge,
    },
    provider: {
      "@type": "EducationalOrganization",
      name: course.provider.name,
      sameAs: course.provider.url,
    },
  };
}
