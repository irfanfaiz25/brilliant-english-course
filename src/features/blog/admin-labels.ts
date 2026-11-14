import "server-only";

import { getTranslations } from "next-intl/server";

import { adminLocale } from "@/config/admin-routes";

import { postCategories, type PostCategory } from "./schema";

/** Category names in the admin's language, from the public `Blog.categories` messages. */
export async function postCategoryLabels(): Promise<Record<PostCategory, string>> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Blog.categories" });
  return Object.fromEntries(postCategories.map((category) => [category, t(category)])) as Record<
    PostCategory,
    string
  >;
}
