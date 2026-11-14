"use client";

import { useTranslations } from "next-intl";
import { useWatch, type Control } from "react-hook-form";

import { CardPreview } from "@/components/admin/card-preview";
import { fillTemplate } from "@/lib/template";
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from "@/lib/whatsapp";

import type { EnrollmentStatus, UnitForm, UnitFormInput, UnitSummary } from "../schema";
import { formatUnitSchedule } from "../service";
import { UnitCardView, type UnitCardText } from "./unit-card-view";

/** Texts of the public unit card as templates (`Kode Unit {code}`), filled in the browser. */
export type UnitCardTemplates = Omit<
  UnitCardText,
  "code" | "manager" | "enrollment" | "schedule" | "whatsappUrl"
> & {
  code: string;
  manager: string;
  whatsappMessage: string;
  enrollment: Record<EnrollmentStatus, string>;
};

type UnitCardPreviewProps = {
  control: Control<UnitFormInput, unknown, UnitForm>;
  templates: UnitCardTemplates;
  /** Code of the unit being edited; a new unit shows a sample code until it is saved. */
  code: string;
  /** Location line of the card (district, regency) for the chosen village. */
  district: string;
  regency: string;
  className?: string;
};

/** The Find a Unit card with the form's current values (units are not translated: Indonesian). */
export function UnitCardPreview({
  control,
  templates,
  code,
  district,
  regency,
  className,
}: UnitCardPreviewProps) {
  const t = useTranslations("AdminUnits");
  const values = useWatch({ control });
  const filled = (value: string | undefined, label: string) => value?.trim() || label;
  const name = filled(values.name, t("fields.name"));
  const manager = filled(values.managerName, t("fields.managerName"));
  const enrollment = values.enrollment ?? "open";
  const opensAt = values.opensAt || "00:00";
  const closesAt = values.closesAt || "00:00";
  const openDays = (values.openDays ?? []).filter((day): day is number => typeof day === "number");

  const unit: UnitSummary = {
    code,
    slug: values.slug || "unit",
    name,
    address: filled(values.address, t("fields.address")),
    district,
    regency,
    villageCode: values.villageCode || "00",
    location: { lat: Number(values.latitude) || 0, lng: Number(values.longitude) || 0 },
    manager,
    whatsapp: normalizeWhatsAppNumber(values.whatsapp ?? ""),
    openDays,
    opensAt,
    closesAt,
    levels: (values.levels ?? []).filter((level) => level !== undefined),
    enrollment,
  };

  return (
    <CardPreview locale="id" placement={t("previewPlacement")} className={className}>
      <UnitCardView
        unit={unit}
        text={{
          code: fillTemplate(templates.code, { code }),
          manager: fillTemplate(templates.manager, { name: manager }),
          enrollment: templates.enrollment[enrollment],
          schedule: openDays.length > 0 ? formatUnitSchedule(unit, "id") : "—",
          whatsappUrl: buildWhatsAppUrl(
            unit.whatsapp || "0",
            fillTemplate(templates.whatsappMessage, { unit: name }),
          ),
          labels: templates.labels,
        }}
      />
    </CardPreview>
  );
}
