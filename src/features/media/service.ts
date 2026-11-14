import type { ImageRef } from "@/lib/schemas";

/** The columns of `media_assets` an image needs. */
export type MediaRow = { key: string; width: number; height: number };

/**
 * Public URL of a stored asset. Keys starting with "/" are files bundled under `public/` (the
 * placeholder photos); R2 object keys get the bucket's public URL once uploads land (Phase 4e).
 */
export function mediaUrl(key: string): string {
  return key;
}

/** An `ImageRef` for `next/image` from a media row and the localized alt text. */
export function toImageRef(media: MediaRow, alt: string): ImageRef {
  return { src: mediaUrl(media.key), width: media.width, height: media.height, alt };
}
