import { getTranslations } from "next-intl/server";

import { blogQuery } from "@/features/blog/index-params";
import { postCategories, type PostCategory } from "@/features/blog/schema";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Category filter as plain links (crawlable, works without JS), one row that scrolls sideways on
 * phones instead of wrapping into an uneven block.
 */
export async function CategoryNav({ active }: { active?: PostCategory }) {
  const t = await getTranslations("Blog.categories");
  const options = [undefined, ...postCategories] as const;

  return (
    <nav aria-label={t("label")} className="-mx-5 md:mx-0">
      <ul className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1 md:flex-wrap md:px-0">
        {options.map((category) => {
          const current = category === active;
          return (
            <li key={category ?? "all"} className="shrink-0">
              <Link
                href={{ pathname: "/blog", query: blogQuery({ category }) }}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full border px-4 text-label whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-(--duration-base) ease-out",
                  current
                    ? "border-primary bg-primary text-primary-foreground shadow-glow-primary"
                    : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                {category ? t(category) : t("all")}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
