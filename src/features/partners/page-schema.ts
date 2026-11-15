import { z } from "zod";

import { partnerStepActions, partnershipIcons, starterKitGroups } from "@/config/enums";
import { limits } from "@/config/limits";
import { textField } from "@/lib/form-schemas";

/*
 * Content of the Kemitraan page that admins edit (ADR-041): one setting per section, each a list
 * of items whose shared fields (icon or custom icon, photo, group, link) are stored once and whose copy is stored
 * per locale. Messages are codes (`lib/form-schemas`), translated by `useFormErrorText()`.
 */

export { partnerStepActions, partnershipIcons, starterKitGroups };
export type PartnershipIcon = (typeof partnershipIcons)[number];
export type StarterKitGroup = (typeof starterKitGroups)[number];
export type PartnerStepAction = (typeof partnerStepActions)[number];

const P = limits.partnershipPage;

/** Title and short text of an item in one locale. */
const itemTextSchema = z.object({
  title: textField(2, P.titleMax),
  text: textField(0, P.textMax),
});

/** The copy of an item in every locale (both required: the site is fully bilingual). */
const itemTextsSchema = z.object({ id: itemTextSchema, en: itemTextSchema });

export type ItemText = z.output<typeof itemTextSchema>;
export type ItemTexts = z.output<typeof itemTextsSchema>;

/** A media library id, or "" for none (the card then shows its icon). */
const optionalImageField = z.union([z.literal(""), z.uuid()]);

/**
 * An item's icon: one of the fixed set, optionally replaced by an uploaded image from the media
 * library (`iconImageId`). Documents saved before custom icons existed read as "" (none).
 */
const iconFields = {
  icon: z.enum(partnershipIcons),
  iconImageId: optionalImageField.default(""),
};

const list = <T extends z.ZodType>(item: T, min: number, max: number) =>
  z.array(item).min(min, `tooFew:${min}`).max(max, `tooMany:${max}`);

/** `partnershipBenefits`: why join, the `featured` ones also lead the hero. */
export const partnershipBenefitsSchema = z.object({
  items: list(
    z.object({
      ...iconFields,
      featured: z.boolean(),
      texts: itemTextsSchema,
    }),
    P.benefitsMin,
    P.benefitsMax,
  ),
});

/** `partnership`: the starter kit every partner receives and the starting investment. */
export const partnershipKitSchema = z.object({
  /** Starting investment in IDR; `null` keeps it for the consultation. */
  investment: z
    .number("investmentInvalid")
    .int("investmentInvalid")
    .positive("investmentInvalid")
    .nullable(),
  items: list(
    z.object({
      group: z.enum(starterKitGroups),
      ...iconFields,
      imageId: optionalImageField,
      texts: itemTextsSchema,
    }),
    P.kitMin,
    P.kitMax,
  ),
});

/**
 * The starter-kit form: the investment is typed as text (digits, or empty to keep it for the
 * consultation) and converted with `toInvestment()` before the action validates the setting.
 */
export const partnershipKitFormSchema = partnershipKitSchema.extend({
  investment: z.string().trim().regex(/^\d*$/, "investmentInvalid"),
});

export type PartnershipKitForm = z.output<typeof partnershipKitFormSchema>;
export type PartnershipKitFormInput = z.input<typeof partnershipKitFormSchema>;

export const toInvestment = (raw: string): number | null =>
  raw.trim() === "" ? null : Number(raw.trim());

/**
 * `partnershipTraining`: how a BEC lesson runs, step by step, the training formats and a gallery
 * of training photos.
 */
const trainingFields = z.object({
  /** Gallery of training sessions and partners in the field; the first is the large photo. */
  photos: z
    .array(
      z.object({
        imageId: z.uuid("imageRequired"),
        caption: z.object({
          id: textField(0, P.captionMax),
          en: textField(0, P.captionMax),
        }),
      }),
    )
    .max(P.photosMax, `tooMany:${P.photosMax}`),
  flow: list(z.object({ texts: itemTextsSchema }), P.flowMin, P.flowMax),
  formats: list(z.object({ ...iconFields, texts: itemTextsSchema }), 1, P.formatsMax),
});

/**
 * Before the gallery the section held one `imageId`: such a document reads as a gallery of that
 * one photo without a caption, so nothing saved is lost.
 */
function fromSinglePhoto(value: unknown): unknown {
  if (typeof value !== "object" || value === null || "photos" in value) return value;
  const { imageId, ...rest } = value as { imageId?: unknown };
  const photos =
    typeof imageId === "string" && imageId ? [{ imageId, caption: { id: "", en: "" } }] : [];
  return { ...rest, photos };
}

export const partnershipTrainingSchema = z.preprocess(fromSinglePhoto, trainingFields);

/** The same section as the admin form edits it (always in the gallery shape). */
export const partnershipTrainingFormSchema = trainingFields;

/** `partnershipSteps`: the procedure from checking the quota to joining the partner group. */
export const partnershipStepsSchema = z.object({
  items: list(
    z.object({
      ...iconFields,
      action: z.enum(partnerStepActions),
      texts: itemTextsSchema,
    }),
    P.stepsMin,
    P.stepsMax,
  ),
});

export type PartnershipBenefits = z.output<typeof partnershipBenefitsSchema>;
export type PartnershipKit = z.output<typeof partnershipKitSchema>;
export type PartnershipTraining = z.output<typeof partnershipTrainingSchema>;
export type PartnershipSteps = z.output<typeof partnershipStepsSchema>;

export type PartnershipBenefitsInput = z.input<typeof partnershipBenefitsSchema>;
export type PartnershipKitInput = z.input<typeof partnershipKitSchema>;
export type PartnershipTrainingInput = z.input<typeof trainingFields>;
export type PartnershipStepsInput = z.input<typeof partnershipStepsSchema>;

/** Every editable section of the page, as stored. */
export type PartnershipPageContent = {
  benefits: PartnershipBenefits;
  kit: PartnershipKit;
  training: PartnershipTraining;
  steps: PartnershipSteps;
};
