"use server";

import { updateTag } from "next/cache";
import type { z } from "zod";

import { cacheTags } from "@/config/cache-tags";
import { partnershipSettingSchema } from "@/features/partners/schema";
import { getCurrentUser } from "@/features/users/session";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { can, type Resource } from "@/lib/permissions";

import type { SettingKey } from "./keys";
import { contactSettingsSchema, type SettingsActionError } from "./schema";
import { saveSetting } from "./service";

type SettingsResult = ActionResult<null, SettingsActionError>;

/**
 * validate → authorize → store with audit → revalidate (AGENTS.md § 4). Validation runs first so
 * the form gets field errors, but nothing is stored without the permission.
 */
async function updateSetting<T>(
  key: SettingKey,
  schema: z.ZodType<T, unknown>,
  input: unknown,
  resource: Extract<Resource, "settings" | "seo">,
): Promise<SettingsResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }

  const user = await getCurrentUser();
  if (!user || !can(user, "update", resource)) return { ok: false, error: "forbidden" };

  try {
    await saveSetting(key, parsed.data, user.id);
  } catch (error) {
    console.error(`[settings] saving "${key}" failed`, error);
    return { ok: false, error: "unknown" };
  }
  updateTag(cacheTags.settings);
  return { ok: true, data: null };
}

/** Head-office contact details shown in the header, footer, Kontak and WhatsApp links. */
export async function updateContactSettings(input: unknown): Promise<SettingsResult> {
  return updateSetting("contact", contactSettingsSchema, input, "settings");
}

/** The partnership package (investment and inclusions) shown on Kemitraan, per locale. */
export async function updatePartnershipSettings(input: unknown): Promise<SettingsResult> {
  return updateSetting("partnership", partnershipSettingSchema, input, "settings");
}
