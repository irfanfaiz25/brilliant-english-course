"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { limits } from "@/config/limits";

import { updateQuotaRulesAction } from "../actions";
import { quotaRulesSchema, type QuotaRules, type QuotaRulesInput } from "../schema";

/** The per-village maximum and the "almost full" threshold (the `quota` setting). */
export function QuotaRulesForm({
  defaultValues,
  canEdit,
}: {
  defaultValues: QuotaRulesInput;
  canEdit: boolean;
}) {
  const t = useTranslations("AdminQuota.rules");
  const errorText = useFormErrorText();
  const form = useForm<QuotaRulesInput, unknown, QuotaRules>({
    resolver: zodResolver(quotaRulesSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const { onSubmit, isPending } = useSaveForm(form, updateQuotaRulesAction);
  const number = { valueAsNumber: true } as const;

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!canEdit} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("unitsPerVillage")}
            description={t("unitsPerVillageHint")}
            error={errorText(errors.unitsPerVillage?.message)}
            required
          >
            {(control) => (
              <Input
                {...control}
                {...form.register("unitsPerVillage", number)}
                type="number"
                inputMode="numeric"
                min={1}
                max={limits.quota.unitsPerVillageMax}
              />
            )}
          </Field>
          <Field
            label={t("almostFullAt")}
            description={t("almostFullAtHint")}
            error={errorText(errors.almostFullAt?.message)}
            required
          >
            {(control) => (
              <Input
                {...control}
                {...form.register("almostFullAt", number)}
                type="number"
                inputMode="numeric"
                min={0}
                max={limits.quota.unitsPerVillageMax}
              />
            )}
          </Field>
        </div>
        {canEdit && (
          <FormFooter isDirty={isDirty} isPending={isPending} onReset={() => form.reset()} />
        )}
      </fieldset>
    </form>
  );
}
