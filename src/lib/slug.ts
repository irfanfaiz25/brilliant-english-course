/** URL-safe slug: lowercase ASCII words joined by dashes ("Kab. Bógor & Co!" → "kab-bogor-co"). */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const slugSchemaPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
