"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { NativeSelect } from "@/components/admin/native-select";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { limits } from "@/config/limits";

import { updateLeadAction } from "../admin-actions";
import {
  leadStatuses,
  leadUpdateSchema,
  type LeadStatus,
  type LeadUpdate,
  type LeadUpdateInput,
} from "../schema";

type LeadManageFormProps = {
  defaultValues: LeadUpdateInput;
  /** Stage names (`Admin.leadStatus`), passed from the server. */
  statusLabels: Record<LeadStatus, string>;
  assignees: readonly { id: string; name: string; email: string }[];
  canEdit: boolean;
};

/** Status, assignee and an optional note explaining the change, saved together. */
export function LeadManageForm({
  defaultValues,
  statusLabels,
  assignees,
  canEdit,
}: LeadManageFormProps) {
  const t = useTranslations("AdminLeads.manage");
  const errorText = useFormErrorText();
  const form = useForm<LeadUpdateInput, unknown, LeadUpdate>({
    resolver: zodResolver(leadUpdateSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  // Two staff with the same name are told apart by their email.
  const names = assignees.map((person) => person.name);
  const sharedName = (name: string) => names.indexOf(name) !== names.lastIndexOf(name);
  const { onSubmit, isPending } = useSaveForm(form, updateLeadAction, {
    successMessage: t("saved"),
    // The note belongs to this change only; the next change starts with an empty one.
    onSaved: () => form.reset({ ...form.getValues(), note: "" }),
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!canEdit} className="flex flex-col gap-5">
        <Field label={t("status")} error={errorText(errors.status?.message)} required>
          {(control) => (
            <NativeSelect {...control} {...form.register("status")}>
              {leadStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field label={t("assignee")} error={errorText(errors.assignedToId?.message)}>
          {(control) => (
            <NativeSelect {...control} {...form.register("assignedToId")}>
              <option value="">{t("assigneeNone")}</option>
              {assignees.map((person) => (
                <option key={person.id} value={person.id}>
                  {sharedName(person.name) ? `${person.name} (${person.email})` : person.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field
          label={t("note")}
          description={t("noteHint")}
          error={errorText(errors.note?.message)}
        >
          {(control) => (
            <Textarea
              {...control}
              {...form.register("note")}
              rows={3}
              maxLength={limits.leads.noteMax}
              placeholder={t("notePlaceholder")}
            />
          )}
        </Field>
        {canEdit && (
          <FormFooter
            isDirty={isDirty}
            isPending={isPending}
            saveLabel={t("save")}
            onReset={() => form.reset()}
          />
        )}
      </fieldset>
    </form>
  );
}
