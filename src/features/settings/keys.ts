/** Keys of the `settings` table: one JSON document each (ADR-024). */
export const settingKeys = {
  contact: "contact",
  /** Kemitraan page (ADR-041): starter kit and investment, benefits, training, steps. */
  partnership: "partnership",
  partnershipBenefits: "partnershipBenefits",
  partnershipTraining: "partnershipTraining",
  partnershipSteps: "partnershipSteps",
  quota: "quota",
  /** What `admin` and `editor` may do (Pengguna › Hak akses, ADR-036). */
  rolePermissions: "rolePermissions",
  seo: "seo",
} as const;

export type SettingKey = (typeof settingKeys)[keyof typeof settingKeys];
