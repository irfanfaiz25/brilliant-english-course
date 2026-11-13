import { z } from "zod";

import { regionCodeSchema } from "@/features/regions/schema";

/** Coordinates are rounded to ~100 m before they reach the URL (privacy, shareable links). */
export const COORDINATE_DECIMALS = 3;
export const MAX_QUERY_LENGTH = 80;

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/**
 * Without JS, each region select submits its own `wilayah` value; the deepest (last non-empty)
 * one is the selected region.
 */
const deepestValue = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item !== "").at(-1)
    : value || undefined;

const optionalText = z.preprocess(
  firstValue,
  z
    .string()
    .trim()
    .transform((text) => text.slice(0, MAX_QUERY_LENGTH))
    .optional()
    .catch(undefined),
);

const optionalNumber = (min: number, max: number) =>
  z.preprocess(firstValue, z.coerce.number().min(min).max(max).optional().catch(undefined));

/**
 * The Cek Unit page state, read from the URL so every result is shareable and crawlable:
 * `?q=` text · `?wilayah=` deepest selected region code · `?lat=&lng=` user location ·
 * `?dekat=1` came from a "use my location" link. Invalid values are dropped, never thrown.
 */
const rawFinderParamsSchema = z.object({
  q: optionalText,
  wilayah: z.preprocess(deepestValue, regionCodeSchema.optional().catch(undefined)),
  lat: optionalNumber(-90, 90),
  lng: optionalNumber(-180, 180),
  dekat: z.preprocess(firstValue, z.literal("1").optional().catch(undefined)),
});

export type FinderParams = {
  query?: string;
  regionCode?: string;
  near?: { lat: number; lng: number };
  /** Visitor asked for nearby units but has not shared a location yet. */
  wantsLocation: boolean;
};

export function parseFinderParams(
  searchParams: Record<string, string | string[] | undefined>,
): FinderParams {
  const raw = rawFinderParamsSchema.parse(searchParams);
  const near =
    raw.lat !== undefined && raw.lng !== undefined ? { lat: raw.lat, lng: raw.lng } : undefined;
  return {
    query: raw.q || undefined,
    regionCode: raw.wilayah,
    near,
    wantsLocation: raw.dekat === "1" && !near,
  };
}

/** Query object for a finder link (`Link href={{ pathname: "/cek-unit", query }}`); empty values are omitted. */
export function finderQuery(params: Omit<FinderParams, "wantsLocation">): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.query) query.q = params.query;
  if (params.regionCode) query.wilayah = params.regionCode;
  if (params.near) {
    query.lat = params.near.lat.toFixed(COORDINATE_DECIMALS);
    query.lng = params.near.lng.toFixed(COORDINATE_DECIMALS);
  }
  return query;
}
