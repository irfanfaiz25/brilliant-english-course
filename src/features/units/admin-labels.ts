import "server-only";

import { getTranslations } from "next-intl/server";

import type { UnitCardTemplates } from "./components/unit-card-preview";
import { enrollmentStatuses } from "./schema";

/** The public unit card's texts in Indonesian, as templates the live preview fills in. */
export async function unitCardTemplates(): Promise<UnitCardTemplates> {
  const [t, tWhatsApp] = await Promise.all([
    getTranslations({ locale: "id", namespace: "Units" }),
    getTranslations({ locale: "id", namespace: "WhatsApp" }),
  ]);
  return {
    code: t.raw("code") as string,
    manager: t.raw("manager") as string,
    whatsappMessage: tWhatsApp.raw("unit") as string,
    enrollment: Object.fromEntries(
      enrollmentStatuses.map((status) => [status, t("enrollment", { status })]),
    ) as UnitCardTemplates["enrollment"],
    labels: {
      address: t("address"),
      manager: t("managerLabel"),
      schedule: t("schedule"),
      levels: t("levels"),
      chat: t("chat"),
      directions: t("directions"),
    },
  };
}
