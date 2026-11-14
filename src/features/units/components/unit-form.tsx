"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { AdminPanel } from "@/components/admin/admin-panel";
import { FormFooter } from "@/components/admin/form-footer";
import { NativeSelect } from "@/components/admin/native-select";
import { UnsavedChangesGuard } from "@/components/admin/unsaved-changes-guard";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { WeekdayPicker } from "@/components/admin/weekday-picker";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import { levelTheme } from "@/features/programs/level-theme";
import type { LevelSlug } from "@/features/programs/schema";
import { RegionPicker } from "@/features/regions/components/region-picker";
import type { RegionPickerLevel } from "@/features/regions/picker";
import { cn } from "@/lib/utils";

import { createUnitAction, updateUnitAction } from "../actions";
import { unitSlugFromName } from "../codes";
import {
  enrollmentStatuses,
  unitFormSchema,
  unitStatuses,
  type UnitForm as UnitFormOutput,
  type UnitFormInput,
} from "../schema";
import { buildMapUrl } from "../service";
import { UnitCardPreview, type UnitCardTemplates } from "./unit-card-preview";

const U = limits.units;

type UnitFormProps = {
  /** The unit being edited; absent when adding a new one. */
  id?: string;
  /** Lead the new unit is created from: it is converted on save (Phase 4d). */
  leadId?: string;
  /** Assigned code, or a sample shown in the preview of a new unit. */
  code: string;
  defaultValues: UnitFormInput;
  regionLevels: readonly RegionPickerLevel[];
  /** District and regency names of the saved village, for the preview. */
  place: { district: string; regency: string };
  levelOptions: readonly { slug: LevelSlug; name: string }[];
  templates: UnitCardTemplates;
};

/** Add or edit a unit: identity, location, contact and schedule, levels and students. */
export function UnitForm({
  id,
  leadId,
  code,
  defaultValues,
  regionLevels,
  place: initialPlace,
  levelOptions,
  templates,
}: UnitFormProps) {
  const t = useTranslations("AdminUnits");
  const errorText = useFormErrorText();
  const router = useRouter();
  const form = useForm<UnitFormInput, unknown, UnitFormOutput>({
    resolver: zodResolver(unitFormSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  // A new unit's slug follows its name until the admin edits the slug itself.
  const [slugFollowsName, setSlugFollowsName] = useState(!id);
  const [place, setPlace] = useState(initialPlace);
  const [status, slug, latitude, longitude] = useWatch({
    control: form.control,
    name: ["status", "slug", "latitude", "longitude"],
  });
  const { onSubmit, isPending } = useSaveForm(form, id ? updateUnitAction : createUnitAction, {
    toInput: (values) => (id ? { ...values, id } : { ...values, leadId }),
    // From a lead, go back to it: it now shows as converted with its new unit.
    onSaved: id
      ? undefined
      : () => router.push(leadId ? `${adminRoutes.leads}/${leadId}` : adminRoutes.units),
  });
  const number = { valueAsNumber: true } as const;
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <UnsavedChangesGuard when={isDirty && !isPending} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <UnitCardPreview
          control={form.control}
          templates={templates}
          code={code}
          district={place.district || "—"}
          regency={place.regency || "—"}
          className="xl:order-last"
        />

        <div className="flex min-w-0 flex-col gap-6">
          <AdminPanel
            title={t("sections.identity.title")}
            description={t("sections.identity.description")}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("fields.name")} error={errorText(errors.name?.message)} required>
                {(control) => (
                  <Input
                    {...control}
                    {...form.register("name", {
                      onChange: (event: { target: { value: string } }) => {
                        if (slugFollowsName) {
                          form.setValue("slug", unitSlugFromName(event.target.value), {
                            shouldDirty: true,
                          });
                        }
                      },
                    })}
                    maxLength={U.nameMax}
                  />
                )}
              </Field>
              <Field
                label={t("fields.slug")}
                description={t("fields.slugHint", { path: `/unit/…/${slug || "…"}` })}
                error={errorText(errors.slug?.message)}
                required
              >
                {(control) => (
                  <Input
                    {...control}
                    {...form.register("slug", { onChange: () => setSlugFollowsName(false) })}
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={U.slugMax}
                  />
                )}
              </Field>
              {id && (
                <Field label={t("fields.code")} description={t("fields.codeHint")}>
                  {(control) => <Input {...control} value={code} readOnly className="bg-muted" />}
                </Field>
              )}
              <Field
                label={t("fields.status")}
                description={t(`statusHint.${status}`)}
                error={errorText(errors.status?.message)}
                required
                className={cn(!id && "sm:col-start-1")}
              >
                {(control) => (
                  <NativeSelect {...control} {...form.register("status")}>
                    {unitStatuses.map((value) => (
                      <option key={value} value={value}>
                        {t(`status.${value}`)}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
              <Field
                label={t("fields.enrollment")}
                error={errorText(errors.enrollment?.message)}
                required
              >
                {(control) => (
                  <NativeSelect {...control} {...form.register("enrollment")}>
                    {enrollmentStatuses.map((value) => (
                      <option key={value} value={value}>
                        {t(`enrollment.${value}`)}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
            </div>
          </AdminPanel>

          <AdminPanel
            title={t("sections.location.title")}
            description={t("sections.location.description")}
          >
            <Controller
              control={form.control}
              name="villageCode"
              render={({ field, fieldState }) => (
                <RegionPicker
                  initialLevels={regionLevels}
                  error={errorText(fieldState.error?.message)}
                  onChange={(villageCode, path) => {
                    field.onChange(villageCode);
                    setPlace({ district: path[2]?.name ?? "", regency: path[1]?.name ?? "" });
                  }}
                />
              )}
            />
            <Field label={t("fields.address")} error={errorText(errors.address?.message)} required>
              {(control) => (
                <Textarea
                  {...control}
                  {...form.register("address")}
                  rows={2}
                  maxLength={U.addressMax}
                  className="min-h-20"
                />
              )}
            </Field>
            <div className="flex flex-col gap-3">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label={t("fields.latitude")}
                  error={errorText(errors.latitude?.message)}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      {...form.register("latitude", number)}
                      type="number"
                      inputMode="decimal"
                      step="any"
                    />
                  )}
                </Field>
                <Field
                  label={t("fields.longitude")}
                  error={errorText(errors.longitude?.message)}
                  required
                >
                  {(control) => (
                    <Input
                      {...control}
                      {...form.register("longitude", number)}
                      type="number"
                      inputMode="decimal"
                      step="any"
                    />
                  )}
                </Field>
              </div>
              <p className="text-body-sm text-muted-foreground">{t("fields.coordinatesHint")}</p>
              {hasCoordinates && (
                <a
                  href={buildMapUrl({ lat: Number(latitude), lng: Number(longitude) })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1.5 rounded-md text-body-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {t("fields.checkOnMap")}
                  <ExternalLinkIcon aria-hidden className="size-4" />
                </a>
              )}
            </div>
          </AdminPanel>

          <AdminPanel
            title={t("sections.contact.title")}
            description={t("sections.contact.description")}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t("fields.managerName")}
                error={errorText(errors.managerName?.message)}
                required
              >
                {(control) => (
                  <Input {...control} {...form.register("managerName")} maxLength={U.managerMax} />
                )}
              </Field>
              <Field
                label={t("fields.whatsapp")}
                description={t("fields.whatsappHint")}
                error={errorText(errors.whatsapp?.message)}
                required
              >
                {(control) => (
                  <Input
                    {...control}
                    {...form.register("whatsapp")}
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                  />
                )}
              </Field>
            </div>
            <Controller
              control={form.control}
              name="openDays"
              render={({ field, fieldState }) => (
                <WeekdayPicker
                  value={field.value}
                  onChange={field.onChange}
                  label={t("fields.openDays")}
                  error={errorText(fieldState.error?.message)}
                />
              )}
            />
            <div className="grid grid-cols-2 gap-5 sm:max-w-md">
              <Field label={t("fields.opensAt")} error={errorText(errors.opensAt?.message)}>
                {(control) => <Input {...control} {...form.register("opensAt")} type="time" />}
              </Field>
              <Field label={t("fields.closesAt")} error={errorText(errors.closesAt?.message)}>
                {(control) => <Input {...control} {...form.register("closesAt")} type="time" />}
              </Field>
            </div>
          </AdminPanel>

          <AdminPanel
            title={t("sections.program.title")}
            description={t("sections.program.description")}
          >
            <Controller
              control={form.control}
              name="levels"
              render={({ field, fieldState }) => (
                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-1 text-label text-foreground">{t("fields.levels")}</legend>
                  <div className="flex flex-wrap gap-2">
                    {levelOptions.map((level) => {
                      const checked = field.value.includes(level.slug);
                      return (
                        <label
                          key={level.slug}
                          className={cn(
                            "flex h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-4 text-body-sm font-semibold transition-colors duration-(--duration-fast)",
                            "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                            checked
                              ? cn("border-transparent", levelTheme[level.slug].soft)
                              : "border-border bg-background hover:border-primary/60",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              field.onChange(
                                checked
                                  ? field.value.filter((slugValue) => slugValue !== level.slug)
                                  : levelOptions
                                      .map((option) => option.slug)
                                      .filter(
                                        (slugValue) =>
                                          slugValue === level.slug ||
                                          field.value.includes(slugValue),
                                      ),
                              )
                            }
                            className="size-5 cursor-pointer accent-primary"
                          />
                          {level.name}
                        </label>
                      );
                    })}
                  </div>
                  {fieldState.error?.message && (
                    <p role="alert" className="text-body-sm font-medium text-destructive-strong">
                      {errorText(fieldState.error.message)}
                    </p>
                  )}
                </fieldset>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t("fields.studentsCount")}
                description={t("fields.studentsHint")}
                error={errorText(errors.studentsCount?.message)}
                required
              >
                {(control) => (
                  <Input
                    {...control}
                    {...form.register("studentsCount", number)}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={U.studentsMax}
                  />
                )}
              </Field>
              <Field
                label={t("fields.openedAt")}
                description={t("fields.openedAtHint")}
                error={errorText(errors.openedAt?.message)}
              >
                {(control) => <Input {...control} {...form.register("openedAt")} type="date" />}
              </Field>
            </div>
          </AdminPanel>
        </div>
      </div>

      <FormFooter
        sticky
        saveWhenClean={!id}
        saveLabel={id ? undefined : t("add")}
        isDirty={isDirty}
        isPending={isPending}
        onReset={() => form.reset()}
      />
    </form>
  );
}
