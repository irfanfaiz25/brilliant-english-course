/**
 * Value lists shared by the Zod schemas in `features/<domain>/schema.ts` and the Postgres enums
 * in `src/db/schema`. They live here, with no imports, because this module is loaded by three
 * very different consumers: the browser bundle (forms), drizzle-kit (which cannot resolve the
 * `@/` alias, so `src/db/schema` imports it relatively) and the Node scripts.
 *
 * Feature modules re-export the lists they own, so the rest of the app keeps importing them from
 * the domain (`@/features/regions/schema`), never from here directly.
 */

export const locales = ["id", "en"] as const;

/** Roles checked by `src/lib/permissions.ts` (ADR-006). `mitra` is scoped to one unit. */
export const userRoles = ["super_admin", "admin", "editor", "mitra"] as const;

export const regionLevels = ["province", "regency", "district", "village"] as const;

export const levelSlugs = ["kindy", "intro", "secondary"] as const;

/** Lifecycle of a partner unit; only `active` units are public and count toward quota. */
export const unitStatuses = ["onboarding", "active", "inactive"] as const;

/** Whether a unit is taking new students. */
export const enrollmentStatuses = ["open", "limited", "full"] as const;

export const partnerBackgrounds = ["educator", "parent", "entrepreneur", "other"] as const;

export const partnerSpaceOptions = ["ready", "preparing", "notYet"] as const;

/** Pipeline of a partner lead in admin (Phase 4d). `onboarding` reserves a village quota slot. */
export const leadStatuses = [
  "new",
  "contacted",
  "qualified",
  "onboarding",
  "converted",
  "rejected",
  "lost",
] as const;

export const postCategories = ["tips-belajar", "parenting", "kegiatan", "kemitraan"] as const;

export const postStatuses = ["draft", "published", "archived"] as const;

export const testimonialAudiences = ["parent", "partner"] as const;

export const faqTopics = ["parents", "program", "partners"] as const;

/** What an SEO override belongs to; `page` uses a route key (`home`, `kemitraan`, …) as its id. */
export const seoEntityTypes = ["page", "program", "post", "unit"] as const;

export const notificationChannels = ["email", "telegram", "whatsapp"] as const;

export const notificationStatuses = ["queued", "sent", "failed"] as const;
