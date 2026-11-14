import { z } from "zod";

import { limits } from "@/config/limits";
import { textField } from "@/lib/form-schemas";

/** File types the library accepts; every upload is stored as WebP (ADR-031). */
export const mediaUploadTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type MediaUploadType = (typeof mediaUploadTypes)[number];

/** Why a file cannot be uploaded; translated from `AdminMedia.upload.errors`. */
export type UploadErrorCode =
  | "fileType"
  | "fileTooLarge"
  | "fileEmpty"
  | "uploadFailed"
  | "uploadMissing"
  | "invalidImage"
  | "forbidden"
  | "unknown";

/** Checked in the browser before uploading and again by `startUploadAction`. */
export const uploadStartSchema = z.object({
  name: z.string().trim().min(1, "fileEmpty").max(255),
  type: z.enum(mediaUploadTypes, "fileType"),
  size: z.number().int().positive("fileEmpty").max(limits.media.maxUploadBytes, "fileTooLarge"),
});
export type UploadStart = z.infer<typeof uploadStartSchema>;

/** Raw uploads wait under `tmp/<uuid>` until they are processed. */
export const uploadKeyPattern =
  /^tmp\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const uploadFinishSchema = z.object({
  uploadId: z.string().regex(uploadKeyPattern),
  name: z.string().trim().max(255),
});
export type UploadFinish = z.infer<typeof uploadFinishSchema>;

export const mediaIdSchema = z.object({ id: z.uuid() });

export const mediaRenameSchema = z.object({
  id: z.uuid(),
  name: textField(1, limits.media.nameMax),
});
export type MediaRenameInput = z.input<typeof mediaRenameSchema>;
export type MediaRename = z.infer<typeof mediaRenameSchema>;

/** The first problem with a file, before any network request; `null` when it may be uploaded. */
export function uploadFileError(file: {
  name: string;
  type: string;
  size: number;
}): UploadErrorCode | null {
  const result = uploadStartSchema.safeParse(file);
  if (result.success) return null;
  const message = result.error.issues[0]?.message;
  return message === "fileType" || message === "fileTooLarge" || message === "fileEmpty"
    ? message
    : "fileType";
}

/** Library name from a file name: no extension, separators as spaces, within `nameMax`. */
export function displayName(fileName: string): string {
  const name = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, " ")
    .trim()
    .slice(0, limits.media.nameMax)
    .trim();
  return name || "gambar";
}
