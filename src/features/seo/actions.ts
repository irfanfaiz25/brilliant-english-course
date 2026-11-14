"use server";

import { cacheTags } from "@/config/cache-tags";
import { saveSetting } from "@/features/settings/service";
import { guardedAction } from "@/features/users/guarded-action";
import { can } from "@/lib/permissions";

import { pageSeoSchema, seoDefaultsSchema } from "./schema";
import { savePageSeo } from "./service";

/** Title, description and (super admin only) `noindex` of one static page, in every locale. */
export async function updatePageSeo(input: unknown) {
  return guardedAction({
    label: "seo",
    schema: pageSeoSchema,
    input,
    permission: ["update", "seo"],
    tags: [cacheTags.seo],
    run: (page, user) =>
      savePageSeo(page, { actorId: user.id, canSetNoindex: can(user, "update", "seoIndexing") }),
  });
}

/** The site-wide default description, used by pages without a description of their own. */
export async function updateSeoDefaults(input: unknown) {
  return guardedAction({
    label: "seo",
    schema: seoDefaultsSchema,
    input,
    permission: ["update", "seo"],
    tags: [cacheTags.settings],
    run: (value, user) => saveSetting("seo", value, user.id),
  });
}
