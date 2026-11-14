import { publicEnv } from "@/lib/public-env";
import type { ImageRef } from "@/lib/schemas";

/** The columns of `media_assets` an image needs. */
export type MediaRow = { key: string; width: number; height: number };

/** Where stored images are served: the R2 bucket's domain, or the local driver's route. */
export const mediaBaseUrl = (publicEnv.NEXT_PUBLIC_MEDIA_URL ?? "/api/media/files").replace(
  /\/$/,
  "",
);

/**
 * Public URL of a stored asset. Keys starting with "/" are files bundled under `public/` (the
 * placeholder photos); uploaded images are object keys under the media base URL.
 */
export function mediaUrl(key: string): string {
  return key.startsWith("/") ? key : `${mediaBaseUrl}/${key}`;
}

/** An `ImageRef` for `next/image` from a media row and the localized alt text. */
export function toImageRef(media: MediaRow, alt: string): ImageRef {
  return { src: mediaUrl(media.key), width: media.width, height: media.height, alt };
}
