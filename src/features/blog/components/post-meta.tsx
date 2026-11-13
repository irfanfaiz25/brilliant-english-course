import { CalendarIcon, ClockIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

import type { PostSummary } from "../schema";

/** Publish date (machine-readable `<time>`) and reading time. */
export async function PostMeta({
  post,
  className,
}: {
  post: Pick<PostSummary, "publishedAt" | "readingMinutes">;
  className?: string;
}) {
  const t = await getTranslations("Blog");
  const format = await getFormatter();

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <CalendarIcon aria-hidden className="size-3.5" />
        <time dateTime={post.publishedAt}>
          {format.dateTime(new Date(post.publishedAt), { dateStyle: "medium", timeZone: "UTC" })}
        </time>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ClockIcon aria-hidden className="size-3.5" />
        {t("readingTime", { minutes: post.readingMinutes })}
      </span>
    </p>
  );
}
