/**
 * Cache tags for `"use cache"` data. Admin mutations call `revalidateTag()` with the same tag,
 * so keep every tag here instead of repeating string literals.
 */
export const cacheTags = {
  programs: "programs",
  activities: "activities",
  units: "units",
  regions: "regions",
  testimonials: "testimonials",
  faq: "faq",
  quota: "quota",
  blog: "blog",
  settings: "settings",
} as const;
