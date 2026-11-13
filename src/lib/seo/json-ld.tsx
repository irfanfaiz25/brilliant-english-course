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

export type LocalBusinessInput = {
  name: string;
  url: string;
  telephone: string;
  streetAddress: string;
  locality: string;
  region?: string;
  geo: { lat: number; lng: number };
  /** schema.org day names, e.g. ["Monday", "Tuesday"]. */
  openDays: readonly string[];
  opens: string;
  closes: string;
};

/** `LocalBusiness` for a BEC unit (AGENTS.md § 4 SEO). */
export function localBusinessJsonLd(unit: LocalBusinessInput): JsonLdThing {
  return {
    "@type": "LocalBusiness",
    name: unit.name,
    url: unit.url,
    telephone: unit.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: unit.streetAddress,
      addressLocality: unit.locality,
      ...(unit.region ? { addressRegion: unit.region } : {}),
      addressCountry: "ID",
    },
    geo: { "@type": "GeoCoordinates", latitude: unit.geo.lat, longitude: unit.geo.lng },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: unit.openDays,
      opens: unit.opens,
      closes: unit.closes,
    },
  };
}

/** `ItemList` wrapping other things (e.g. the units in a search result). */
export function itemListJsonLd(items: readonly JsonLdThing[]): JsonLdThing {
  return {
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item,
    })),
  };
}

type ArticleInput = {
  headline: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  inLanguage: string;
  author: string;
  publisher: { name: string; logo: string };
};

/** `BlogPosting` for a blog post (Google article rich results). */
export function articleJsonLd(article: ArticleInput): JsonLdThing {
  return {
    "@type": "BlogPosting",
    headline: article.headline,
    description: article.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": article.url },
    url: article.url,
    image: [article.image],
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    inLanguage: article.inLanguage,
    author: { "@type": "Organization", name: article.author },
    publisher: {
      "@type": "Organization",
      name: article.publisher.name,
      logo: { "@type": "ImageObject", url: article.publisher.logo },
    },
  };
}

type OrganizationInput = {
  name: string;
  url: string;
  logo: string;
  email: string;
  telephone: string;
  address: string;
  sameAs: readonly string[];
  /** schema.org `OpeningHoursSpecification` values (day names + `HH:MM`). */
  hours: readonly { days: readonly string[]; opens: string; closes: string }[];
  availableLanguage: readonly string[];
};

/** `EducationalOrganization` with a customer-service `ContactPoint` (Kontak page). */
export function organizationJsonLd(org: OrganizationInput): JsonLdThing {
  return {
    "@type": "EducationalOrganization",
    name: org.name,
    url: org.url,
    logo: org.logo,
    email: org.email,
    telephone: org.telephone,
    address: { "@type": "PostalAddress", streetAddress: org.address, addressCountry: "ID" },
    sameAs: org.sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: org.telephone,
      email: org.email,
      availableLanguage: org.availableLanguage,
      hoursAvailable: org.hours.map((entry) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: entry.days,
        opens: entry.opens,
        closes: entry.closes,
      })),
    },
  };
}
