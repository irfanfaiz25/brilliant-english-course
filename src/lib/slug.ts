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

/** `base` (or `fallback` when empty), then `base-2`, `base-3`, … whichever is not taken yet. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>, fallback: string): string {
  const root = base || fallback;
  if (!taken.has(root)) return root;
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}
