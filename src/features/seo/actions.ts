"use server";

import { updateTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { saveSetting } from "@/features/settings/service";
import { getCurrentUser } from "@/features/users/session";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { can } from "@/lib/permissions";

import { pageSeoSchema, seoDefaultsSchema, type SeoActionError } from "./schema";
import { savePageSeo } from "./service";

type SeoResult = ActionResult<null, SeoActionError>;

/** Title, description and (super admin only) `noindex` of one static page, in every locale. */
export async function updatePageSeo(input: unknown): Promise<SeoResult> {
  const parsed = pageSeoSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "invalid", fieldErrors: fieldErrorsOf(parsed.error.issues) };

  const user = await getCurrentUser();
  if (!user || !can(user, "update", "seo")) return { ok: false, error: "forbidden" };

  try {
    await savePageSeo(parsed.data, {
      actorId: user.id,
      canSetNoindex: can(user, "update", "seoIndexing"),
    });
  } catch (error) {
    console.error(`[seo] saving page "${parsed.data.page}" failed`, error);
    return { ok: false, error: "unknown" };
  }
  updateTag(cacheTags.seo);
  return { ok: true, data: null };
}

/** The site-wide default description, used by pages without a description of their own. */
export async function updateSeoDefaults(input: unknown): Promise<SeoResult> {
  const parsed = seoDefaultsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "invalid", fieldErrors: fieldErrorsOf(parsed.error.issues) };

  const user = await getCurrentUser();
  if (!user || !can(user, "update", "seo")) return { ok: false, error: "forbidden" };

  try {
    await saveSetting("seo", parsed.data, user.id);
  } catch (error) {
    console.error("[seo] saving the defaults failed", error);
    return { ok: false, error: "unknown" };
  }
  updateTag(cacheTags.settings);
  return { ok: true, data: null };
}
