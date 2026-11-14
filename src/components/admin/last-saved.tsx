import { getFormatter, getTranslations } from "next-intl/server";

import { adminLocale, adminTimeZone } from "@/config/admin-routes";

type LastSavedProps = {
  /** `undefined` = never saved, the code defaults apply. */
  meta: { updatedAt: Date; updatedBy: string | null } | undefined;
};

/** "Last changed 14 Nov 2026 07.10 by Rina" line for an admin panel. */
export async function LastSaved({ meta }: LastSavedProps) {
  const [t, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminForms" }),
    getFormatter({ locale: adminLocale }),
  ]);
  if (!meta) return t("neverSaved");

  const date = format.dateTime(meta.updatedAt, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: adminTimeZone,
  });
  return meta.updatedBy
    ? t("lastSaved", { date, name: meta.updatedBy })
    : t("lastSavedUnknown", { date });
}
