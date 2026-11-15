"use client";

import { useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";

import { NativeSelect } from "@/components/admin/native-select";
import { Field } from "@/components/ui/field";

import { partnershipIcons, type PartnershipIcon as IconName } from "../page-schema";
import { PartnershipIcon } from "./partnership-icon";

type IconSelectProps = {
  field: UseFormRegisterReturn;
  /** The current value, for the preview next to the select. */
  value: IconName | undefined;
  label: string;
};

/** Picks one of the fixed Kemitraan icons by name, with the chosen icon shown beside it. */
export function IconSelect({ field, value, label }: IconSelectProps) {
  const t = useTranslations("AdminPartnershipPage.icons");
  return (
    <Field label={label}>
      {(control) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-partner-soft text-partner">
            {value && <PartnershipIcon name={value} className="size-6" />}
          </span>
          <div className="min-w-0 flex-1">
            <NativeSelect {...control} {...field}>
              {partnershipIcons.map((icon) => (
                <option key={icon} value={icon}>
                  {t(icon)}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      )}
    </Field>
  );
}
