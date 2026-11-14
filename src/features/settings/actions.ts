"use server";

import { cacheTags } from "@/config/cache-tags";
import { partnershipSettingSchema } from "@/features/partners/schema";
import { guardedAction } from "@/features/users/guarded-action";

import { contactSettingsSchema } from "./schema";
import { saveSetting } from "./service";

/** Head-office contact details shown in the header, footer, Kontak and WhatsApp links. */
export async function updateContactSettings(input: unknown) {
  return guardedAction({
    label: "settings",
    schema: contactSettingsSchema,
    input,
    permission: ["update", "settings"],
    tags: [cacheTags.settings],
    run: (value, user) => saveSetting("contact", value, user.id),
  });
}

/** The partnership package (investment and inclusions) shown on Kemitraan, per locale. */
export async function updatePartnershipSettings(input: unknown) {
  return guardedAction({
    label: "settings",
    schema: partnershipSettingSchema,
    input,
    permission: ["update", "settings"],
    tags: [cacheTags.settings],
    run: (value, user) => saveSetting("partnership", value, user.id),
  });
}
