import { getLocale, getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import type { UnitSummary } from "../schema";
import { formatUnitSchedule } from "../service";
import { UnitCardView } from "./unit-card-view";

type UnitCardProps = {
  unit: UnitSummary;
  /** Shown as a chip when results are sorted by distance, e.g. "2,4 km". */
  distanceLabel?: string;
  /** Page path under `/unit` (province, regency, unit); the name links to it. */
  path?: readonly string[];
};

/** The unit card with its texts in the request's locale (`UnitCardView` draws it). */
export async function UnitCard({ unit, distanceLabel, path }: UnitCardProps) {
  const t = await getTranslations("Units");
  const tWhatsApp = await getTranslations("WhatsApp");
  const locale = (await getLocale()) as Locale;

  return (
    <UnitCardView
      unit={unit}
      distanceLabel={distanceLabel}
      path={path}
      text={{
        code: t("code", { code: unit.code }),
        enrollment: t("enrollment", { status: unit.enrollment }),
        manager: t("manager", { name: unit.manager }),
        schedule: formatUnitSchedule(unit, locale),
        whatsappUrl: buildWhatsAppUrl(unit.whatsapp, tWhatsApp("unit", { unit: unit.name })),
        labels: {
          address: t("address"),
          manager: t("managerLabel"),
          schedule: t("schedule"),
          levels: t("levels"),
          chat: t("chat"),
          directions: t("directions"),
        },
      }}
    />
  );
}
