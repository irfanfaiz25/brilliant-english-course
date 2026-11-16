import type { Locale } from "@/i18n/routing";

import { isWithinRegion } from "@/features/regions/service";

import type { LevelBadge } from "@/features/programs/schema";

import type { UnitSummary } from "./schema";

/** Monday-based reference week, used only to get localized weekday names. */
const REFERENCE_MONDAY = Date.UTC(2024, 0, 1);
const DAY_MS = 86_400_000;

function weekdayName(isoDay: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    new Date(REFERENCE_MONDAY + (isoDay - 1) * DAY_MS),
  );
}

function isConsecutive(days: readonly number[]): boolean {
  return days.every((day, index) => index === 0 || day === (days[index - 1] ?? 0) + 1);
}

/** Local time notation: "14.00" in Indonesian, "14:00" in English. */
function formatTime(time: string, locale: Locale): string {
  return locale === "id" ? time.replace(":", ".") : time;
}

/**
 * Human schedule like "Senin – Sabtu · 14.00 – 18.00". Consecutive days collapse into a range;
 * other sets are listed ("Senin, Rabu, Jumat").
 */
export function formatUnitSchedule(
  unit: Pick<UnitSummary, "openDays" | "opensAt" | "closesAt">,
  locale: Locale,
): string {
  const days = [...new Set(unit.openDays)].sort((a, b) => a - b);
  const first = days[0];
  const last = days[days.length - 1];
  const dayText =
    first !== undefined && last !== undefined && days.length > 2 && isConsecutive(days)
      ? `${weekdayName(first, locale)} – ${weekdayName(last, locale)}`
      : new Intl.ListFormat(locale, { style: "short", type: "unit" }).format(
          days.map((day) => weekdayName(day, locale)),
        );

  return `${dayText} · ${formatTime(unit.opensAt, locale)} – ${formatTime(unit.closesAt, locale)}`;
}

/** "14:00:00" (Postgres `time`) → "14:00", the `HH:MM` form unit schedules use. */
export function timeOfDay(value: string): string {
  return value.slice(0, 5);
}

/** Google Maps directions link to the unit's address (no API key needed). */
export function buildDirectionsUrl(address: string): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", address);
  return url.toString();
}

/** Google Maps pin at the unit's coordinates (opens the app on phones). */
export function buildMapUrl(location: { lat: number; lng: number }): string {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", `${location.lat},${location.lng}`);
  return url.toString();
}

/** Two-letter initials for the unit avatar, e.g. "Unit Sukamaju" → "SU". */
export function unitInitials(name: string): string {
  const words = name
    .replace(/^unit\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const [first = "", second = ""] = words;
  return (second ? first[0] + second[0] : first.slice(0, 2)).toUpperCase();
}

type GeoPoint = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km (haversine) — accurate enough for "nearest unit" sorting. */
export function distanceKm(from: GeoPoint, to: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Lowercase, accent-free, single-spaced text for forgiving search ("Pakánsari " → "pakansari"). */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type UnitSearch = {
  /** Free text matched against unit name, district, regency and address (all words must match). */
  query?: string;
  /** Kemendagri code; keeps units located inside this region. */
  regionCode?: string;
  /** When set, results are sorted by distance and carry `distanceKm`. */
  near?: GeoPoint;
};

export type UnitResult = UnitSummary & { distanceKm?: number };

/** Filters and orders units for the finder: nearest first with a location, otherwise by name. */
export function searchUnits(units: readonly UnitSummary[], search: UnitSearch): UnitResult[] {
  const words = normalizeSearchText(search.query ?? "")
    .split(" ")
    .filter(Boolean);

  const matches = units.filter((unit) => {
    if (search.regionCode && !isWithinRegion(unit.villageCode, search.regionCode)) return false;
    if (words.length === 0) return true;
    const haystack = normalizeSearchText(
      [unit.name, unit.district, unit.regency, unit.address].join(" "),
    );
    return words.every((word) => haystack.includes(word));
  });

  const { near } = search;
  if (near) {
    return matches
      .map((unit) => ({ ...unit, distanceKm: distanceKm(near, unit.location) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
  return [...matches].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/** What a unit offers in one level: every class (also later ones) or only `classIds`. */
export type LevelOffer = { levelId: string; allClasses: boolean; classIds: string[] };

/**
 * Turns the levels and classes ticked in the unit form into what is stored (ADR-040). A level
 * whose classes are all ticked (or that has none) is offered whole; a level with some ticked
 * keeps exactly those; a level with classes but none ticked is refused (`null`).
 */
export function resolveLevelOffers(
  levels: readonly { id: string; classIds: readonly string[] }[],
  chosen: readonly string[],
): LevelOffer[] | null {
  const picked = new Set(chosen);
  const offers: LevelOffer[] = [];
  for (const level of levels) {
    const classIds = level.classIds.filter((id) => picked.has(id));
    if (level.classIds.length > 0 && classIds.length === 0) return null;
    const allClasses = classIds.length === level.classIds.length;
    offers.push({ levelId: level.id, allClasses, classIds: allClasses ? [] : classIds });
  }
  return offers;
}

/** A program level on a unit card: every level is shown, so cards compare at a glance. */
export type LevelSlot = LevelBadge & {
  offered: boolean;
  /** Offered with only some of its classes (ADR-040). */
  partial: boolean;
};

/** One slot per site level, in display order, marked with what the unit opens there. */
export function buildLevelSlots(
  levels: readonly LevelBadge[],
  unit: Pick<UnitSummary, "levels" | "someClasses">,
): LevelSlot[] {
  return levels.map(({ slug, name, theme }) => {
    const offered = unit.levels.includes(slug);
    return { slug, name, theme, offered, partial: offered && Boolean(unit.someClasses?.[slug]) };
  });
}
