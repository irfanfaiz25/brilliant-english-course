import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";

import { contactSettingsFixture } from "./fixtures";
import type { ContactSettings } from "./schema";

/** Head-office contact details. Reads code defaults until admin settings land (Phase 4a). */
export async function getContactSettings(): Promise<ContactSettings> {
  "use cache";
  cacheTag(cacheTags.settings);
  cacheLife("hours");
  return contactSettingsFixture;
}
