"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  Loader2Icon,
  MapPinIcon,
  MapPinnedIcon,
  SendIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { limits } from "@/config/limits";
import { submitPartnerApplication } from "@/features/partners/actions";
import {
  partnerApplicantSchema,
  partnerBackgrounds,
  partnerFormSteps,
  partnerSpaceOptions,
  type PartnerApplicantInput,
  type PartnerApplicationError,
} from "@/features/partners/schema";
import type { QuotaStatus } from "@/features/quota/schema";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type SelectedVillage = {
  code: string;
  name: string;
  area: string;
  status: QuotaStatus;
  remaining: number;
};

type Submitted = { reference: string; whatsappUrl: string; village: string; name: string };

const STEP_KEYS = ["contact", "details"] as const;
const QUOTA_BADGE = { available: "success", almostFull: "warning", full: "destructive" } as const;

const defaultValues: PartnerApplicantInput = {
  fullName: "",
  whatsapp: "",
  email: "",
  // Radio groups start empty; the schema rejects the empty value with "choose one".
  background: "" as PartnerApplicantInput["background"],
  space: "" as PartnerApplicantInput["space"],
  motivation: "",
  consent: false,
};

/** Native radio styled as a selectable card (`has-checked` keeps it CSS-only and accessible). */
const choiceClass = cn(
  "relative flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 text-label text-foreground",
  "transition-[border-color,background-color,box-shadow] duration-(--duration-fast) ease-out hover:border-neutral-400",
  "has-checked:border-partner has-checked:bg-partner-soft/60 has-checked:shadow-sm",
  "has-focus-visible:ring-4 has-focus-visible:ring-partner-soft",
);

/**
 * Two-step partner application (DESIGN.md § 5.2 Kemitraan): contact details, then a few
 * questions. One Zod schema validates here and in the Server Action; the village comes from
 * the quota checker (URL state), so changing it never resets what was typed.
 */
export function PartnerForm({ village }: { village: SelectedVillage | null }) {
  const t = useTranslations("PartnerForm");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<PartnerApplicationError | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [isSubmitting, startSubmit] = useTransition();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const movedRef = useRef(false);

  const form = useForm<PartnerApplicantInput>({
    resolver: zodResolver(partnerApplicantSchema),
    defaultValues,
    // Errors appear on "next"/submit and clear while typing (`field` below). No validation on
    // blur: a message appearing or vanishing on blur shifts the buttons under the pointer and
    // swallows the click.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const {
    register,
    handleSubmit,
    trigger,
    setError,
    reset,
    control,
    formState: { errors },
  } = form;
  /** `register` plus live re-validation of a field that is currently showing an error. */
  const field = (name: keyof PartnerApplicantInput) =>
    register(name, {
      onChange: () => {
        if (form.getFieldState(name).invalid) void trigger(name);
      },
    });
  const motivation = useWatch({ control, name: "motivation" }) ?? "";

  // Move focus to the new step's heading so keyboard and screen-reader users follow along
  // (skipped on first render, so the page does not jump to the form).
  useEffect(() => {
    if (movedRef.current) stepHeadingRef.current?.focus();
  }, [step, submitted]);

  const goTo = (next: number) => {
    movedRef.current = true;
    setStep(next);
  };

  const next = async () => {
    if (await trigger([...partnerFormSteps[0]], { shouldFocus: true })) goTo(1);
  };

  const errorText = (code?: string) => (code ? t(`errors.${code}` as "errors.invalid") : undefined);

  const send = (values: PartnerApplicantInput, trap: string) => {
    setFormError(null);
    if (!village) {
      setFormError("villageRequired");
      return;
    }
    startSubmit(async () => {
      const result = await submitPartnerApplication(
        locale,
        { ...values, villageCode: village.code },
        trap,
      );
      if (result.ok) {
        movedRef.current = true;
        setSubmitted({ ...result.data, name: values.fullName.trim() });
        return;
      }
      setFormError(result.error);
      if (result.error === "quotaFull") router.refresh();
      const fieldErrors = Object.entries(result.fieldErrors ?? {});
      for (const [name, code] of fieldErrors) {
        if (name in defaultValues && code) {
          setError(name as keyof PartnerApplicantInput, { message: code });
        }
      }
      const [firstField] = fieldErrors[0] ?? [];
      if (firstField && (partnerFormSteps[0] as readonly string[]).includes(firstField)) goTo(0);
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Enter on the first step moves on instead of submitting half a form.
    if (step === 0) {
      event.preventDefault();
      void next();
      return;
    }
    const trap = new FormData(event.currentTarget).get("website");
    void handleSubmit((values) => send(values, typeof trap === "string" ? trap : ""))(event);
  };

  if (submitted) {
    return (
      <FormCard>
        <div className="flex animate-rise-in flex-col items-center gap-5 py-6 text-center">
          <span className="inline-flex size-16 animate-settle items-center justify-center rounded-full bg-success-soft text-success-strong shadow-sm">
            <CheckIcon aria-hidden className="size-8" />
          </span>
          <h3 ref={stepHeadingRef} tabIndex={-1} className="text-h3 text-foreground outline-none">
            {t("success.title")}
          </h3>
          <p className="max-w-md text-body text-muted-foreground">
            {t("success.text", { name: submitted.name, village: submitted.village })}
          </p>
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-partner/50 bg-partner-soft/50 px-6 py-3">
            <span className="text-caption text-muted-foreground uppercase">
              {t("success.referenceLabel")}
            </span>
            <span className="font-mono text-h4 tracking-wider text-foreground">
              {submitted.reference}
            </span>
          </div>
          <div className="flex w-full flex-col items-center gap-2">
            <Button asChild variant="whatsapp" size="lg" pop className="w-full sm:w-auto">
              <a href={submitted.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <BrandIcon name="whatsapp" />
                {t("success.whatsappCta")}
              </a>
            </Button>
            <p className="text-caption text-muted-foreground">{t("success.whatsappHint")}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              reset(defaultValues);
              setSubmitted(null);
              goTo(0);
            }}
          >
            {t("success.again")}
          </Button>
        </div>
      </FormCard>
    );
  }

  const quotaFull = village?.status === "full";

  return (
    <FormCard>
      <form noValidate onSubmit={onSubmit} aria-label={t("label")} className="flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h4 text-foreground">{t("title")}</h3>
            <span className="text-caption whitespace-nowrap text-muted-foreground">
              {t("stepOf", { current: step + 1, total: STEP_KEYS.length })}
            </span>
          </div>
          <ol className="grid grid-cols-2 gap-2">
            {STEP_KEYS.map((key, index) => (
              <li key={key} className="flex flex-col gap-2">
                <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      "block h-full origin-left rounded-full bg-partner transition-transform duration-(--duration-slow) ease-out",
                      index <= step ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </span>
                <span
                  aria-current={index === step ? "step" : undefined}
                  className={cn(
                    "text-caption font-semibold transition-colors duration-(--duration-base)",
                    index <= step ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {t(`steps.${key}`)}
                </span>
              </li>
            ))}
          </ol>
          <VillageSummary village={village} highlight={formError === "villageRequired"} />
        </header>

        {/* Honeypot: hidden from people and assistive tech; bots that fill it get a fake success. */}
        <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
          <label>
            {t("fields.honeypot")}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div key={step} className="flex animate-rise-in flex-col gap-5">
          <h4 ref={stepHeadingRef} tabIndex={-1} className="sr-only">
            {t(`steps.${STEP_KEYS[step] ?? "contact"}`)}
          </h4>

          {step === 0 ? (
            <>
              <Field
                label={t("fields.fullName")}
                required
                error={errorText(errors.fullName?.message)}
              >
                {(control) => (
                  <Input
                    {...control}
                    {...field("fullName")}
                    autoComplete="name"
                    placeholder={t("fields.fullNamePlaceholder")}
                    maxLength={limits.partnerApplication.nameMax}
                  />
                )}
              </Field>
              <Field
                label={t("fields.whatsapp")}
                required
                description={t("fields.whatsappHint")}
                error={errorText(errors.whatsapp?.message)}
              >
                {(control) => (
                  <Input
                    {...control}
                    {...field("whatsapp")}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={t("fields.whatsappPlaceholder")}
                  />
                )}
              </Field>
              <Field
                label={
                  <>
                    {t("fields.email")}
                    <span className="font-normal text-muted-foreground">
                      {t("fields.emailOptional")}
                    </span>
                  </>
                }
                error={errorText(errors.email?.message)}
              >
                {(control) => (
                  <Input
                    {...control}
                    {...field("email")}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={t("fields.emailPlaceholder")}
                  />
                )}
              </Field>
            </>
          ) : (
            <>
              <ChoiceGroup
                legend={t("fields.background")}
                error={errorText(errors.background?.message)}
                className="grid-cols-1 sm:grid-cols-2"
              >
                {partnerBackgrounds.map((value) => (
                  <label key={value} className={choiceClass}>
                    <input
                      type="radio"
                      value={value}
                      {...field("background")}
                      className="size-4 shrink-0 accent-partner"
                    />
                    {t(`backgrounds.${value}`)}
                  </label>
                ))}
              </ChoiceGroup>
              <ChoiceGroup
                legend={t("fields.space")}
                error={errorText(errors.space?.message)}
                className="grid-cols-3"
              >
                {partnerSpaceOptions.map((value) => (
                  <label key={value} className={cn(choiceClass, "justify-center px-2 text-center")}>
                    <input type="radio" value={value} {...field("space")} className="sr-only" />
                    {t(`spaces.${value}`)}
                  </label>
                ))}
              </ChoiceGroup>
              <Field
                label={
                  <>
                    {t("fields.motivation")}
                    <span className="font-normal text-muted-foreground">
                      {t("fields.motivationOptional")}
                    </span>
                  </>
                }
                description={t("fields.motivationCount", {
                  count: motivation.length,
                  max: limits.partnerApplication.motivationMax,
                })}
                error={errorText(errors.motivation?.message)}
              >
                {(control) => (
                  <Textarea
                    {...control}
                    {...field("motivation")}
                    rows={3}
                    maxLength={limits.partnerApplication.motivationMax}
                    placeholder={t("fields.motivationPlaceholder")}
                  />
                )}
              </Field>
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-start gap-3 text-body-sm text-foreground">
                  <input
                    type="checkbox"
                    {...field("consent")}
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={errors.consent ? "consent-error" : undefined}
                    className="mt-0.5 size-5 shrink-0 cursor-pointer accent-partner"
                  />
                  {t("fields.consent")}
                </label>
                {errors.consent?.message && (
                  <p
                    id="consent-error"
                    role="alert"
                    className="text-body-sm font-medium text-destructive-strong"
                  >
                    {errorText(errors.consent.message)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {formError && formError !== "villageRequired" && (
          <p
            role="alert"
            className="flex animate-rise-in items-start gap-2 rounded-xl bg-destructive-soft px-4 py-3 text-body-sm text-destructive-strong"
          >
            <AlertCircleIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t(`errors.${formError}`)}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}>
              <ArrowLeftIcon aria-hidden />
              {t("back")}
            </Button>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          {step === 0 ? (
            // Distinct keys: React must not reuse the "next" button node as the submit button.
            <Button key="next" type="button" variant="partner" size="lg" onClick={next}>
              {t("next")}
              <ArrowRightIcon aria-hidden />
            </Button>
          ) : (
            <Button
              key="submit"
              type="submit"
              variant="partner"
              size="lg"
              pop
              disabled={isSubmitting || quotaFull}
              aria-disabled={isSubmitting || quotaFull}
            >
              {isSubmitting ? (
                <Loader2Icon aria-hidden className="animate-spin" />
              ) : (
                <SendIcon aria-hidden />
              )}
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          )}
        </div>
      </form>
    </FormCard>
  );
}

function FormCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-3xl border border-border/60 bg-card p-5 shadow-glow-partner sm:p-8">
      {children}
    </div>
  );
}

/** The village from the quota checker, or a prompt to pick one first. */
function VillageSummary({
  village,
  highlight,
}: {
  village: SelectedVillage | null;
  highlight: boolean;
}) {
  const t = useTranslations("PartnerForm");
  const tQuota = useTranslations("PartnerForm.village");

  if (!village) {
    return (
      <div
        role={highlight ? "alert" : undefined}
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-dashed px-4 py-3 transition-colors duration-(--duration-base)",
          highlight ? "border-destructive bg-destructive-soft/60" : "border-border bg-surface/60",
        )}
      >
        <MapPinnedIcon
          aria-hidden
          className={cn("size-5 shrink-0", highlight ? "text-destructive-strong" : "text-partner")}
        />
        <div className="flex min-w-48 flex-1 flex-col">
          <span className="text-label text-foreground">{tQuota("none")}</span>
          <span
            className={cn(
              "text-caption",
              highlight ? "text-destructive-strong" : "text-muted-foreground",
            )}
          >
            {highlight ? t("errors.villageRequired") : tQuota("noneHint")}
          </span>
        </div>
        <a
          href="#kuota"
          className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-label text-partner transition-colors duration-(--duration-fast) hover:bg-partner-soft"
        >
          {tQuota("choose")}
        </a>
      </div>
    );
  }

  const full = village.status === "full";
  return (
    <div
      key={village.code}
      className={cn(
        "flex animate-rise-in flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border px-4 py-3",
        full
          ? "border-destructive/40 bg-destructive-soft/50"
          : "border-partner/30 bg-partner-soft/40",
      )}
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-partner shadow-sm">
        <MapPinIcon aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-caption text-muted-foreground">{tQuota("label")}</span>
        <span className="truncate text-label text-foreground">
          {village.name}
          <span className="font-normal text-muted-foreground"> · {village.area}</span>
        </span>
      </div>
      <Badge variant={QUOTA_BADGE[village.status]} className="hidden sm:inline-flex">
        {t(`quota.${village.status}`, { remaining: village.remaining })}
      </Badge>
      <a
        href="#kuota"
        className="shrink-0 rounded-full px-3 py-1.5 text-label text-partner transition-colors duration-(--duration-fast) hover:bg-background"
      >
        {tQuota("change")}
      </a>
      {full && (
        <p className="w-full text-caption font-medium text-destructive-strong">
          {tQuota("fullHint")}
        </p>
      )}
    </div>
  );
}

function ChoiceGroup({
  legend,
  error,
  className,
  children,
}: {
  legend: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset aria-invalid={error ? true : undefined} className="flex flex-col gap-2">
      <legend className="mb-2 text-label text-foreground">
        {legend}
        <span aria-hidden className="text-destructive">
          *
        </span>
      </legend>
      <div className={cn("grid gap-2", className)}>{children}</div>
      {error && (
        <p role="alert" className="text-body-sm font-medium text-destructive-strong">
          {error}
        </p>
      )}
    </fieldset>
  );
}
