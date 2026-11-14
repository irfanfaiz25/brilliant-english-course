"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { AdminPanel } from "@/components/admin/admin-panel";
import { FormFooter } from "@/components/admin/form-footer";
import { NativeSelect } from "@/components/admin/native-select";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import type { UnitOption } from "@/features/units/admin-queries";
import { cn } from "@/lib/utils";

import { createUserAction, updateUserAction } from "../admin-actions";
import type { AccessLink } from "../admin-service";
import {
  userFormSchema,
  userRoles,
  type UserForm as UserFormOutput,
  type UserFormInput,
} from "../schema";
import { AccessLinkDialog, type ShownAccessLink } from "./access-link-dialog";

type UserFormProps = {
  /** The account being edited; absent when adding one. */
  id?: string;
  defaultValues: UserFormInput;
  unitOptions: readonly UnitOption[];
  /** Editing one's own account: the role is locked (ADR-035). */
  isSelf?: boolean;
  roleLabels: Record<(typeof userRoles)[number], string>;
};

/**
 * Add or edit an account: name and email, then the role (with what it allows) and, for a partner,
 * its unit. A new account opens its activation link once saved; closing it goes to the account.
 */
export function UserForm({
  id,
  defaultValues,
  unitOptions,
  isSelf = false,
  roleLabels,
}: UserFormProps) {
  const t = useTranslations("AdminUsers");
  const errorText = useFormErrorText();
  const router = useRouter();
  const [created, setCreated] = useState<{ id: string; link: ShownAccessLink } | null>(null);
  const form = useForm<UserFormInput, unknown, UserFormOutput>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const role = useWatch({ control: form.control, name: "role" });
  const { onSubmit, isPending } = useSaveForm(form, id ? updateUserAction : createUserAction, {
    toInput: (values) => (id ? { ...values, id } : values),
    successMessage: id ? undefined : t("created"),
    onSaved: id
      ? undefined
      : (data) => {
          const result = data as { id: string; link: AccessLink };
          setCreated({ id: result.id, link: result.link });
        },
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <UnsavedChangesGuard when={isDirty && !isPending} />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <AdminPanel
          title={t("sections.profile.title")}
          description={t("sections.profile.description")}
        >
          <Field label={t("fields.name")} error={errorText(errors.name?.message)} required>
            {(control) => (
              <Input
                {...control}
                {...form.register("name")}
                autoComplete="off"
                maxLength={limits.users.nameMax}
              />
            )}
          </Field>
          <Field
            label={t("fields.email")}
            description={t("fields.emailHint")}
            error={errorText(errors.email?.message)}
            required
          >
            {(control) => (
              <Input
                {...control}
                {...form.register("email")}
                type="email"
                autoComplete="off"
                maxLength={limits.users.emailMax}
              />
            )}
          </Field>
        </AdminPanel>

        <AdminPanel title={t("sections.role.title")} description={t("sections.role.description")}>
          {isSelf ? (
            // Read-only: a disabled input would drop out of the submitted values.
            <>
              <p className="flex items-start gap-2 rounded-xl bg-info-soft px-4 py-3 text-body-sm text-info-strong">
                <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                {t("selfNote")}
              </p>
              <div className="flex flex-col gap-1 rounded-xl border border-primary bg-primary-soft/60 p-4">
                <span className="text-body-sm font-semibold text-foreground">
                  {roleLabels[defaultValues.role]}
                </span>
                <span className="text-body-sm text-muted-foreground">
                  {t(`roleDescriptions.${defaultValues.role}`)}
                </span>
              </div>
            </>
          ) : (
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">{t("fields.role")}</legend>
              {userRoles.map((value) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-(--duration-fast)",
                    "hover:border-primary/60 has-checked:border-primary has-checked:bg-primary-soft/60",
                    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                  )}
                >
                  <input
                    type="radio"
                    value={value}
                    {...form.register("role")}
                    className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="text-body-sm font-semibold text-foreground">
                      {roleLabels[value]}
                    </span>
                    <span className="text-body-sm text-muted-foreground">
                      {t(`roleDescriptions.${value}`)}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {role === "mitra" &&
            !isSelf &&
            (unitOptions.length > 0 ? (
              <Field
                label={t("fields.unit")}
                description={t("fields.unitHint")}
                error={errorText(errors.unitId?.message)}
                required
              >
                {(control) => (
                  <NativeSelect {...control} {...form.register("unitId")}>
                    <option value="">{t("fields.unitPlaceholder")}</option>
                    {unitOptions.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} · {unit.code}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
            ) : (
              <p role="alert" className="text-body-sm font-medium text-destructive-strong">
                {t("fields.noUnits")}
              </p>
            ))}
        </AdminPanel>
      </div>

      <FormFooter
        sticky
        saveWhenClean={!id}
        saveLabel={id ? undefined : t("add")}
        isDirty={isDirty}
        isPending={isPending}
        onReset={() => form.reset()}
      />

      <AccessLinkDialog
        link={created?.link ?? null}
        name={form.getValues("name")}
        onClose={() => {
          if (created) router.push(`${adminRoutes.users}/${created.id}`);
          setCreated(null);
        }}
      />
    </form>
  );
}
