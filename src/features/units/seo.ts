import { siteConfig } from "@/config/site";
import { localBusinessJsonLd, type JsonLdThing } from "@/lib/seo/json-ld";

import type { UnitSummary } from "./schema";

/** schema.org day names indexed by ISO weekday − 1. */
export const SCHEMA_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** `LocalBusiness` structured data for a unit (finder results, area and unit pages). */
export function unitJsonLd(
  unit: UnitSummary,
  { url, region }: { url: string; region?: string },
): JsonLdThing {
  return localBusinessJsonLd({
    name: `${siteConfig.name} — ${unit.name}`,
    url,
    telephone: `+${unit.whatsapp}`,
    streetAddress: unit.address,
    locality: unit.regency,
    region,
    geo: unit.location,
    openDays: unit.openDays.map((day) => SCHEMA_DAYS[day - 1] ?? "Monday"),
    opens: unit.opensAt,
    closes: unit.closesAt,
  });
}
