import "server-only";

import { desc } from "drizzle-orm";

import { db } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import type { SessionUser } from "@/features/users/schema";
import { assertCan } from "@/lib/permissions";

import { mediaUrl } from "./service";

/** An image in the media picker. */
export type MediaOption = {
  id: string;
  src: string;
  /** File name shown under the thumbnail. */
  name: string;
  width: number;
  height: number;
};

/** How many images the picker lists; uploads, search and paging arrive with the media module (4e). */
const PICKER_LIMIT = 120;

/** The newest images for the media picker. Checks `media` read access. */
export async function getMediaOptions(actor: SessionUser): Promise<MediaOption[]> {
  assertCan(actor, "read", "media");
  const rows = await db
    .select({
      id: mediaAssets.id,
      key: mediaAssets.key,
      width: mediaAssets.width,
      height: mediaAssets.height,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(PICKER_LIMIT);
  return rows.map(({ key, ...row }) => ({
    ...row,
    src: mediaUrl(key),
    name: key.split("/").at(-1) ?? key,
  }));
}
