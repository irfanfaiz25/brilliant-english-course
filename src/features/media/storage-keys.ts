import { randomUUID } from "node:crypto";

/** Key of a raw upload, before processing. */
export const newUploadKey = () => `tmp/${randomUUID()}`;

/** Key of a processed image, grouped by month: `media/2026/11/<uuid>.webp`. */
export function assetKey(now = new Date()): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `media/${now.getUTCFullYear()}/${month}/${randomUUID()}.webp`;
}

/** Bundled placeholders live in `public/` and have no storage object to delete. */
export const isBundledKey = (key: string) => key.startsWith("/");
