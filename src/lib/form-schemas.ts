import { z } from "zod";

import { normalizeWhatsAppNumber } from "./whatsapp";

/*
 * Building blocks for admin form schemas. Messages are codes, optionally with a limit after a
 * colon ("tooLong:120"); `useFormErrorText()` translates them with the limit filled in.
 */

/** Trimmed text between `min` and `max` characters. */
export function textField(min: number, max: number) {
  return z
    .string()
    .trim()
    .min(min, min <= 1 ? "required" : `tooShort:${min}`)
    .max(max, `tooLong:${max}`);
}

/** Whole number in a range, from a number input (`valueAsNumber`; empty = `NaN`). */
export function integerField(min: number, max: number) {
  return z
    .number("numberRequired")
    .int("numberRequired")
    .min(min, `numberMin:${min}`)
    .max(max, `numberMax:${max}`);
}

/**
 * A list edited as rows (`{ value }`, what React Hook Form field arrays need) and stored as plain
 * strings. Errors keep the row path (`skills.2.value`), so they land on the right input.
 */
export function rowListField(item: z.ZodType<string, string>, min: number, max: number) {
  return z
    .array(z.object({ value: item }))
    .min(min, `tooFew:${min}`)
    .max(max, `tooMany:${max}`)
    .transform((rows) => rows.map((row) => row.value));
}

/** Rows for a `rowListField` from stored strings. */
export function toRows(values: readonly string[]): { value: string }[] {
  return values.map((value) => ({ value }));
}

/** A `media_assets` id picked in the media picker. */
export const imageIdField = z.uuid("imageRequired");

/** "HH:MM", 24-hour. "HH:MM" strings compare correctly as text (`closes > opens`). */
export const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "timeInvalid");

/** ISO weekdays (1 = Monday … 7 = Sunday), at least one, each once. */
export const weekdaysField = z
  .array(z.number().int().min(1).max(7))
  .min(1, "daysRequired")
  .refine((days) => new Set(days).size === days.length, "daysRequired");

/**
 * An Indonesian mobile number for WhatsApp. Admins may type "0812…" or "+62 812…"; it is stored
 * as "62812…", the digits `wa.me` links need.
 */
export const whatsappField = z
  .string()
  .trim()
  .transform(normalizeWhatsAppNumber)
  .pipe(z.string().regex(/^628\d{7,11}$/, "whatsappInvalid"));
