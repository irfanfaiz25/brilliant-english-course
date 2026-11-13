import { z } from "zod";

import { postCategories, type PostCategory } from "./schema";

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/**
 * Blog index state from the URL: `?kategori=` category · `?halaman=` page (1-based).
 * Invalid values are dropped, never thrown, so old or hand-edited links still work.
 */
const rawBlogParamsSchema = z.object({
  kategori: z.preprocess(firstValue, z.enum(postCategories).optional().catch(undefined)),
  halaman: z.preprocess(firstValue, z.coerce.number().int().min(1).optional().catch(undefined)),
});

export type BlogParams = { category?: PostCategory; page: number };

export function parseBlogParams(
  searchParams: Record<string, string | string[] | undefined>,
): BlogParams {
  const raw = rawBlogParamsSchema.parse(searchParams);
  return { category: raw.kategori, page: raw.halaman ?? 1 };
}

/** Query object for a blog index link; defaults are left out so URLs stay short. */
export function blogQuery({ category, page }: Partial<BlogParams>): Record<string, string> {
  return {
    ...(category ? { kategori: category } : {}),
    ...(page && page > 1 ? { halaman: String(page) } : {}),
  };
}
