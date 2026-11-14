/** Keys of the `settings` table: one JSON document each (ADR-024). */
export const settingKeys = {
  contact: "contact",
  partnership: "partnership",
  quota: "quota",
  seo: "seo",
} as const;

export type SettingKey = (typeof settingKeys)[keyof typeof settingKeys];
