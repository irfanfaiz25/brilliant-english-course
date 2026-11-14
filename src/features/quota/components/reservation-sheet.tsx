"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormFooter } from "@/components/admin/form-footer";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { useSaveForm } from "@/components/admin/use-save-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { limits } from "@/config/limits";
import { RegionPicker } from "@/features/regions/components/region-picker";
import type { RegionPickerLevel } from "@/features/regions/picker";

import { createReservationAction } from "../actions";
import { reservationFormSchema, type ReservationForm, type ReservationFormInput } from "../schema";

type ReservationSheetProps = {
  /** Picker state, prefilled with the village being checked (if any). */
  regionLevels: readonly RegionPickerLevel[];
  villageCode: string;
  /** Button label, e.g. "Pesan slot" or "Pesan slot di desa ini". */
  triggerLabel: string;
  variant?: "primary" | "secondary";
};

/** "Reserve a slot" button with a side sheet: village, slots, end date and a note. */
export function ReservationSheet({
  regionLevels,
  villageCode,
  triggerLabel,
  variant = "primary",
}: ReservationSheetProps) {
  const t = useTranslations("AdminQuota.reserveForm");
  const errorText = useFormErrorText();
  const [open, setOpen] = useState(false);
  // Remount the picker on every open so it starts from the prefilled village again.
  const [session, setSession] = useState(0);
  const defaultValues: ReservationFormInput = { villageCode, slots: 1, note: "", expiresOn: "" };
  const form = useForm<ReservationFormInput, unknown, ReservationForm>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const { onSubmit, isPending } = useSaveForm(form, createReservationAction, {
    onSaved: () => {
      setOpen(false);
      form.reset(defaultValues);
    },
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSession((value) => value + 1);
        else form.reset(defaultValues);
      }}
    >
      <SheetTrigger asChild>
        <Button variant={variant} size="sm">
          <PlusIcon aria-hidden />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:w-[min(92vw,32rem)]">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <Controller
            control={form.control}
            name="villageCode"
            render={({ field, fieldState }) => (
              <RegionPicker
                key={session}
                initialLevels={regionLevels}
                columns={1}
                error={errorText(fieldState.error?.message)}
                onChange={(code) => field.onChange(code)}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("slots")} error={errorText(errors.slots?.message)} required>
              {(control) => (
                <Input
                  {...control}
                  {...form.register("slots", { valueAsNumber: true })}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={limits.quota.reservationSlotsMax}
                />
              )}
            </Field>
            <Field label={t("expiresOn")} error={errorText(errors.expiresOn?.message)}>
              {(control) => <Input {...control} {...form.register("expiresOn")} type="date" />}
            </Field>
          </div>
          <p className="-mt-2 text-body-sm text-muted-foreground">{t("expiresOnHint")}</p>
          <Field label={t("note")} error={errorText(errors.note?.message)}>
            {(control) => (
              <Textarea
                {...control}
                {...form.register("note")}
                rows={2}
                maxLength={limits.quota.reservationNoteMax}
                placeholder={t("notePlaceholder")}
                className="min-h-20"
              />
            )}
          </Field>
          <FormFooter
            saveWhenClean
            saveLabel={t("submit")}
            isDirty={isDirty}
            isPending={isPending}
            onReset={() => form.reset(defaultValues)}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
}
