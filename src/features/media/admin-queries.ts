import "server-only";

import { and, desc, eq, ilike, sql, type SQL } from "drizzle-orm";

import { limits } from "@/config/limits";
import { db } from "@/db/client";
import { mediaAssets, users } from "@/db/schema";
import type { SessionUser } from "@/features/users/schema";
import { assertCan } from "@/lib/permissions";

import { mediaUrl } from "./service";
import { isBundledKey } from "./storage-keys";
import { listUsages, usageCount, type MediaUsage } from "./usage";

/** An image in the media picker. */
export type MediaOption = {
  id: string;
  src: string;
  /** Name shown under the thumbnail. */
  name: string;
  width: number;
  height: number;
};

/** How many images the picker lists, newest first; the library page has search and paging. */
const PICKER_LIMIT = 120;

/** The newest images for the media picker. Checks `media` read access. */
export async function getMediaOptions(actor: SessionUser): Promise<MediaOption[]> {
  assertCan(actor, "read", "media");
  const rows = await db
    .select({
      id: mediaAssets.id,
      key: mediaAssets.key,
      name: mediaAssets.name,
      width: mediaAssets.width,
      height: mediaAssets.height,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt), desc(mediaAssets.id))
    .limit(PICKER_LIMIT);
  return rows.map(({ key, ...row }) => ({ ...row, src: mediaUrl(key) }));
}

export type MediaFilter = { query: string; unused: boolean; page: number };

/** A library card. */
export type MediaItem = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  sizeBytes: number | null;
  createdAt: Date;
  usageCount: number;
  /** A placeholder shipped with the site (not uploaded). */
  bundled: boolean;
};

export type MediaLibrary = {
  items: MediaItem[];
  /** Images matching the filter. */
  total: number;
  /** Totals for the chips; they follow the search but not the chip itself. */
  counts: { all: number; unused: number };
  pageCount: number;
};

const itemColumns = {
  id: mediaAssets.id,
  key: mediaAssets.key,
  name: mediaAssets.name,
  width: mediaAssets.width,
  height: mediaAssets.height,
  sizeBytes: mediaAssets.sizeBytes,
  createdAt: mediaAssets.createdAt,
  usageCount: usageCount(),
};

const toItem = ({ key, ...row }: { key: string } & Omit<MediaItem, "src" | "bundled">) => ({
  ...row,
  src: mediaUrl(key),
  bundled: isBundledKey(key),
});

/** One page of the library, newest first. Checks `media` read access. */
export async function getMediaLibrary(
  actor: SessionUser,
  { query, unused, page }: MediaFilter,
): Promise<MediaLibrary> {
  assertCan(actor, "read", "media");
  // `%` and `_` typed by the admin are literal characters, not wildcards.
  const search = query.trim().replace(/[\\%_]/g, "\\$&");
  const searchWhere: SQL | undefined = search ? ilike(mediaAssets.name, `%${search}%`) : undefined;
  const unusedWhere = sql`${usageCount()} = 0`;
  const where = unused ? and(searchWhere, unusedWhere) : searchWhere;

  const [counts] = await db
    .select({
      all: sql<number>`count(*)::int`,
      unused: sql<number>`(count(*) filter (where ${unusedWhere}))::int`,
    })
    .from(mediaAssets)
    .where(searchWhere);
  const total = (unused ? counts?.unused : counts?.all) ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limits.media.pageSize));

  const rows = await db
    .select(itemColumns)
    .from(mediaAssets)
    .where(where)
    .orderBy(desc(mediaAssets.createdAt), desc(mediaAssets.id))
    .limit(limits.media.pageSize)
    .offset((Math.min(page, pageCount) - 1) * limits.media.pageSize);

  return {
    items: rows.map(toItem),
    total,
    counts: { all: counts?.all ?? 0, unused: counts?.unused ?? 0 },
    pageCount,
  };
}

export type MediaDetail = MediaItem & {
  mimeType: string;
  uploadedBy: string | null;
  usages: MediaUsage[];
};

/** One image with who uploaded it and where it is used. Checks `media` read access. */
export async function getMediaDetail(actor: SessionUser, id: string): Promise<MediaDetail | null> {
  assertCan(actor, "read", "media");
  const [row] = await db
    .select({ ...itemColumns, mimeType: mediaAssets.mimeType, uploadedBy: users.name })
    .from(mediaAssets)
    .leftJoin(users, eq(users.id, mediaAssets.uploadedById))
    .where(eq(mediaAssets.id, id));
  if (!row) return null;
  return {
    ...toItem(row),
    mimeType: row.mimeType,
    uploadedBy: row.uploadedBy,
    usages: await listUsages(id),
  };
}
