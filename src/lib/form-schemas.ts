import { z } from "zod";

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
