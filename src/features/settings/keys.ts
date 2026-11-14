/** Keys of the `settings` table: one JSON document each (ADR-024). */
export const settingKeys = {
  contact: "contact",
  partnership: "partnership",
  quota: "quota",
  /** What `admin` and `editor` may do (Pengguna › Hak akses, ADR-036). */
  rolePermissions: "rolePermissions",
  seo: "seo",
} as const;

export type SettingKey = (typeof settingKeys)[keyof typeof settingKeys];
